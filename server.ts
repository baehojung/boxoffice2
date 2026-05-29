import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dns from "dns";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

// Default result order to IPv4 first for faster system networking
dns.setDefaultResultOrder("ipv4first");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // KOBIS API Key configuration
  const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "861634e24dce0975482676736818690c";

  // API endpoint for daily box office data
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string" || !/^\d{8}$/.test(date)) {
        res.status(400).json({ error: "올바른 날짜 형식(YYYYMMDD)을 입력해주세요." });
        return;
      }

      console.log(`Fetching Daily Box Office for targetDt: ${date}`);
      const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API failed with HTTP status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Boxoffice fetch error:", error);
      res.status(500).json({ error: error.message || "박스오피스 데이터를 불러오는데 실패했습니다." });
    }
  });

  // API endpoint for movie detail information
  app.get("/api/movie-info", async (req, res) => {
    try {
      const { movieCd } = req.query;
      if (!movieCd || typeof movieCd !== "string") {
        res.status(400).json({ error: "올바른 영화 코드가 필요합니다." });
        return;
      }

      console.log(`Fetching Movie Info for movieCd: ${movieCd}`);
      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS Detail API failed with HTTP status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Movie info fetch error:", error);
      res.status(500).json({ error: error.message || "영화 상세정보를 불러오는데 실패했습니다." });
    }
  });

  // API endpoint for generating movie reviews using Gemini
  app.post("/api/generate-review", async (req, res) => {
    try {
      const { movieNm, openDt, genres, directors, actors, shortReview, style } = req.body;
      
      if (!shortReview || typeof shortReview !== "string") {
        res.status(400).json({ error: "간단한 감상평 내용을 입력해주세요." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ 
          error: "GEMINI_API_KEY 환경설정이 필요합니다. AI Studio Secrets 패널에서 키를 등록해 주세요." 
        });
        return;
      }

      const stylePrompts: Record<string, string> = {
        emotional: "감성적이고 따뜻하며 여운을 남기는 독백 스타일의 감상평",
        expert: "영화 평론가처럼 깊이 있고 분석적이며 격조 높은 전문 비평문 스타일의 감상평",
        witty: "소셜 미디어에 업로드하기 좋은 위트 있고 트렌디하며 재미있는 입담 스타일의 감상평",
        neutral: "과장 없이 담백하고 정제된 객관적인 감상평"
      };

      const selectedStylePrompt = stylePrompts[style] || stylePrompts.neutral;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `당신은 전문 영화 평론가이자 스토리텔러입니다. 아래 제공된 영화 정보와 사용자의 짧은 감상 메모를 바탕으로 완성도 높고 깊이 있는 '상세 감상평'을 한글로 정성껏 작성해주세요.

[영화 정보]
- 제목: ${movieNm || "알 수 없음"}
- 개봉/출시: ${openDt || "알 수 없음"}
- 장르: ${Array.isArray(genres) ? genres.join(", ") : (genres || "알 수 없음")}
- 감독: ${Array.isArray(directors) ? directors.join(", ") : (directors || "알 수 없음")}
- 주요 출연진: ${Array.isArray(actors) ? actors.slice(0, 5).join(", ") : (actors || "알 수 없음")}

[작성 스타일 가이드]
- ${selectedStylePrompt}

[사용자의 짧은 감상 평]
"${shortReview}"

[작성 지침]
1. 사용자가 강조한 짧은 감상(핵심 감정, 배우 연기, 영상미 등)을 아주 구체적이고 설득력 있는 비평이나 감성적 서사로 한층 넓히고 다채롭게 살려 확장해 주세요.
2. 관념적이고 뻔한 칭찬보다는, 제공된 영화의 정보(감독, 장르, 배우진 등)를 녹여 신뢰감이 느껴지게 써 주십시오.
3. 영화 감상의 가치를 더해주는 아름다운 국어 문장으로 서술해 주세요.
4. 전체 감상평은 줄바꿈이 깔끔한 2~3개의 문단으로 나누어 읽기 쉽게 작성해 주시고, 맨 마지막 줄에는 '[총평]' 또는 '[한줄평]'을 멋진 인용문 형태로 포함해 별점(5점 만점 형태)과 함께 남겨주세요.
5. Markdown 형식을 적절히 사용하여 읽기 쉽게 하되 지나친 특수문자나 표는 지양해 주십시오.`,
      });

      const detailedReview = response.text || "상세 감상평을 생성하지 못했습니다.";
      res.json({ detailedReview });
    } catch (error: any) {
      console.error("Gemini API Error in generating review:", error);
      res.status(500).json({ error: error.message || "감상평 생성 도중 예기치 못한 오류가 발생했습니다." });
    }
  });

  // Vite middleware for hot updates and client assets in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
