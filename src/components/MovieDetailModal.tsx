import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Film, Clock, User, Users, Shield, Globe, Award, HelpCircle, Star, Sparkles, Copy, Check, Trash2 } from "lucide-react";
import { MovieInfo, KobisMovieInfoResponse } from "../types";

interface MovieDetailModalProps {
  movieCd: string | null;
  movieNm: string;
  onClose: () => void;
}

export function MovieDetailModal({ movieCd, movieNm, onClose }: MovieDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Review Assistant state
  const [shortReview, setShortReview] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("expert");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReview, setGeneratedReview] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savedReviews, setSavedReviews] = useState<Record<string, string>>({});
  const [isCopying, setIsCopying] = useState(false);

  // Load saved reviews on mount/change
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cinebox_saved_reviews");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedReviews(parsed);
        if (parsed[movieCd || ""]) {
          setGeneratedReview(parsed[movieCd || ""]);
        } else {
          setGeneratedReview("");
        }
      } else {
        setGeneratedReview("");
      }
    } catch (e) {
      console.error("Local storage read error", e);
    }
  }, [movieCd]);

  const saveReviewToLocal = (reviewText: string) => {
    try {
      const updated = { ...savedReviews, [movieCd || ""]: reviewText };
      setSavedReviews(updated);
      localStorage.setItem("cinebox_saved_reviews", JSON.stringify(updated));
    } catch (e) {
      console.error("Local storage write error", e);
    }
  };

  const deleteReviewFromLocal = () => {
    try {
      const updated = { ...savedReviews };
      delete updated[movieCd || ""];
      setSavedReviews(updated);
      localStorage.setItem("cinebox_saved_reviews", JSON.stringify(updated));
      setGeneratedReview("");
      setShortReview("");
    } catch (e) {
      console.error("Local storage delete error", e);
    }
  };

  const handleGenerateReview = async () => {
    if (!shortReview.trim()) {
      setReviewError("한 단어 이상의 감상평이나 키워드를 입력해 주세요.");
      return;
    }

    setIsGenerating(true);
    setReviewError(null);

    const directorsNames = movieInfo?.directors?.map(d => d.peopleNm) || [];
    const actorsNames = movieInfo?.actors?.slice(0, 5).map(a => a.peopleNm) || [];
    const genresNames = movieInfo?.genres?.map(g => g.genreNm) || [];

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieNm: movieInfo?.movieNm || movieNm,
          openDt: movieInfo?.openDt || "N/A",
          genres: genresNames,
          directors: directorsNames,
          actors: actorsNames,
          shortReview,
          style: selectedStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "감상평을 생성하지 못했습니다.");
      }

      const data = await response.json();
      setGeneratedReview(data.detailedReview);
      saveReviewToLocal(data.detailedReview);
    } catch (err: any) {
      console.error(err);
      setReviewError(err.message || "리뷰 생성 서버 연결 실패. 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReview = () => {
    if (!generatedReview) return;
    navigator.clipboard.writeText(generatedReview);
    setIsCopying(true);
    setTimeout(() => {
      setIsCopying(false);
    }, 2000);
  };

  useEffect(() => {
    if (!movieCd) return;

    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/movie-info?movieCd=${movieCd}`);
        if (!response.ok) {
          throw new Error("영화 상세정보를 불러오는 데 실패했습니다.");
        }
        const data: KobisMovieInfoResponse = await response.json();
        if (data.movieInfoResult?.movieInfo) {
          setMovieInfo(data.movieInfoResult.movieInfo);
        } else {
          throw new Error("상세 정보 데이터를 찾을 수 없습니다.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [movieCd]);

  // Color selection for movie rating tags - matching Elegant Cinema Dark Theme
  const getGradeColor = (grade: string) => {
    if (!grade) return "bg-white/5 text-white/40 border-white/5";
    const g = grade.toLowerCase();
    if (g.includes("전체") || g.includes("all")) {
      return "bg-emerald-950/40 text-emerald-400 border-emerald-550/30";
    }
    if (g.includes("12")) {
      return "bg-sky-950/40 text-sky-450 border-sky-550/30";
    }
    if (g.includes("15")) {
      return "bg-amber-950/40 text-amber-450 border-amber-550/30";
    }
    if (g.includes("청소년") || g.includes("불가") || g.includes("18") || g.includes("19")) {
      return "bg-red-950/40 text-red-500 border-red-550/30";
    }
    return "bg-white/5 text-white/70 border-white/10";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glass overlay */}
        <motion.div
          id="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm"
        />

        {/* Modal content body */}
        <motion.div
          id="modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-3xl overflow-hidden rounded-sm border border-white/10 bg-[#0a0a0a] text-[#e5e5e5] shadow-2xl shadow-black md:max-h-[90vh] flex flex-col"
        >
          {/* Top dynamic backdrop blur decorative light source */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/10 blur-[100px] rounded-full -mr-28 -mt-28 pointer-events-none"></div>

          {/* Elegant Top Red Border Strip */}
          <div className="h-1 w-full bg-red-600 shrink-0 relative z-10" />

          {/* Close Button on Top Right Corner */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-sm border border-white/10 bg-black/60 text-white/40 hover:text-white hover:border-white/20 transition duration-150"
            aria-label="닫기"
          >
            <X size={14} />
          </button>

          {/* Loading layout view */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 px-6 min-h-[400px]">
              <div className="relative mb-5 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-red-600 animate-spin" />
                <Film className="absolute text-red-500 animate-pulse" size={14} />
              </div>
              <p className="font-mono text-xs tracking-widest text-[#e5e5e5]/40 animate-pulse uppercase">
                ANALYZING CINEMA PROFILE...
              </p>
            </div>
          )}

          {/* Error handling layout view */}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[400px]">
              <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-800/20 flex items-center justify-center mb-4 text-red-500">
                <HelpCircle size={18} />
              </div>
              <h3 className="font-serif text-base text-slate-200 mb-1">상세 프로필 검색 실패</h3>
              <p className="font-sans text-xs text-white/40 max-w-sm mb-6">{error}</p>
              <button
                id="modal-error-close-btn"
                onClick={onClose}
                className="font-mono px-5 py-2 rounded-sm text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white transition"
              >
                CLOSE DIALOGUE
              </button>
            </div>
          )}

          {/* Main profile structured detailed display */}
          {!loading && !error && movieInfo && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8 relative z-10">
              
              {/* Flexbox container spacing metadata from mockup */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left Side: Mock Cinema Art Poster in elegant frame */}
                <div className="w-48 h-72 bg-neutral-900/60 border border-white/10 rounded-sm shadow-2xl overflow-hidden shrink-0 flex flex-col items-center justify-center relative p-4 group">
                  {/* Internal ambient design */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-red-600/5 pointer-events-none" />
                  <div className="text-center space-y-3 relative z-10">
                    <div className="text-red-600 text-3xl animate-pulse">★</div>
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30 block">CINEBOX PROFILE</span>
                      <span className="font-serif italic text-xs text-white/60 block mt-1">CODE: {movieInfo.movieCd}</span>
                    </div>
                  </div>
                  {/* Bottom branding on poster frame */}
                  <div className="absolute bottom-3 left-0 right-0 text-center text-[8px] font-mono tracking-widest text-white/20 select-none uppercase">
                    OFFICIAL REPORT
                  </div>
                </div>

                {/* Right Side Info Columns */}
                <div className="flex-1 space-y-5 min-w-0">
                  {/* Category breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2 py-0.5 border border-red-500 text-red-500 text-[9px] font-bold uppercase tracking-wider rounded-sm font-mono">
                      CINE PROFILE
                    </span>
                    {movieInfo.typeNm && (
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 bg-white/5 px-2 py-0.5 border border-white/10 rounded-sm">
                        {movieInfo.typeNm}
                      </span>
                    )}
                    {movieInfo.nations && movieInfo.nations.length > 0 && (
                      <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-1">
                        <Globe size={11} className="text-red-600" />
                        {movieInfo.nations.map((n) => n.nationNm).join(", ")}
                      </span>
                    )}
                  </div>

                  {/* Movie Large Header */}
                  <div>
                    <h2 className="font-serif font-black text-3xl md:text-4xl text-white leading-tight mb-2 tracking-tight">
                      {movieInfo.movieNm}
                    </h2>
                    {movieInfo.movieNmEn && (
                      <p className="font-sans font-normal text-md tracking-wider text-white/45 uppercase">
                        {movieInfo.movieNmEn}
                      </p>
                    )}
                  </div>

                  {/* Primary Grid specifications like layout sheet */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-5 border-t border-b border-white/10">
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-white/30 mb-1.5 font-mono">상영 시간</span>
                      <p className="text-sm font-semibold text-white/90 font-mono">
                        {movieInfo.showTm ? `${movieInfo.showTm} Min` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-white/30 mb-1.5 font-mono">개봉 일자</span>
                      <p className="text-sm font-semibold text-white/90 font-mono">
                        {movieInfo.openDt
                          ? `${movieInfo.openDt.substring(0, 4)}.${movieInfo.openDt.substring(4, 6)}.${movieInfo.openDt.substring(6, 8)}`
                          : "정보 없음"}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="block text-[9px] uppercase tracking-widest text-white/30 mb-1.5 font-mono">심의 기준</span>
                      <div className="pt-0.5">
                        {movieInfo.audits && movieInfo.audits.length > 0 ? (
                          movieInfo.audits.slice(0, 1).map((audit) => (
                            <span
                              key={audit.auditNo}
                              className={`text-[9.5px] font-sans font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${getGradeColor(
                                audit.watchGradeNm
                              )}`}
                            >
                              {audit.watchGradeNm}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9.5px] px-2 py-0.5 border border-white/5 text-white/30 font-mono">
                            N/A
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Genres row list */}
                  {movieInfo.genres && movieInfo.genres.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {movieInfo.genres.map((g, i) => (
                        <span
                          key={i}
                          className="font-sans text-[10.5px] uppercase tracking-wider px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-white/60"
                        >
                          {g.genreNm}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Advanced detailed lists */}
              <div className="space-y-6 pt-4">
                
                {/* Director details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-mono flex items-center gap-1.5">
                    <User size={13} className="text-red-500" />
                    Director
                  </h4>
                  <div className="p-4 rounded-sm border border-white/10 bg-white/[0.02]/50">
                    {movieInfo.directors && movieInfo.directors.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {movieInfo.directors.map((dir, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-semibold text-white text-sm">{dir.peopleNm}</span>
                            {dir.peopleNmEn && (
                              <span className="font-mono text-xs text-white/40">({dir.peopleNmEn})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-xs italic font-mono">감독진 정보 기록 없음</p>
                    )}
                  </div>
                </div>

                {/* Key actors list with cast titles */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-mono flex items-center gap-1.5">
                    <Users size={13} className="text-red-500" />
                    Top Cast ({movieInfo.actors?.length || 0})
                  </h4>
                  
                  {movieInfo.actors && movieInfo.actors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[170px] overflow-y-auto custom-scrollbar pr-1.5">
                      {movieInfo.actors.map((actor, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-sm border border-white/10 bg-black/40 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="truncate">
                            <p className="font-bold text-white/95 truncate">
                              {actor.peopleNm}
                            </p>
                            {actor.peopleNmEn && (
                              <p className="font-mono text-[10px] text-white/30 truncate">
                                {actor.peopleNmEn}
                              </p>
                            )}
                          </div>
                          {actor.cast && (
                            <span className="font-sans text-[10px] px-2 py-0.5 rounded-sm bg-red-650/10 border border-red-500/20 text-red-400 truncate max-w-[130px]">
                              {actor.cast} 역
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-sm border border-dashed border-white/10 text-center">
                      <p className="font-mono text-xs text-white/20">주요 출연 배우 정보가 대기 상태에 있습니다.</p>
                    </div>
                  )}
                </div>

                {/* Corporate stakeholders (Producers, Distrs) */}
                {movieInfo.companys && movieInfo.companys.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[9px] uppercase tracking-widest text-white/30 font-mono">
                      Production Companies
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {movieInfo.companys.slice(0, 4).map((comp, idx) => (
                        <span
                          key={idx}
                          className="font-sans text-[10px] px-2.5 py-1 rounded-sm border border-white/10 bg-white/5 text-white/60"
                        >
                          {comp.companyNm} <span className="text-[9px] text-white/35">({comp.companyPartNm})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Review Generator Section */}
                <div id="ai-review-section" className="space-y-4 pt-6 border-t border-white/10 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-red-500 w-4 h-4 animate-pulse shrink-0" />
                      <h4 className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                        AI 감상평 도우미 <span className="text-xs text-red-500 font-mono italic">(AI REVIEW ASSISTANT)</span>
                      </h4>
                    </div>
                    {generatedReview && (
                      <button
                        onClick={deleteReviewFromLocal}
                        className="text-[10px] font-mono text-red-400/80 hover:text-red-400 hover:underline transition self-start sm:self-center flex items-center gap-1"
                        title="리뷰를 삭제하고 새로 작성합니다"
                      >
                        <Trash2 size={11} />
                        초기화 및 초기 리뷰 삭제
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-white/40 leading-relaxed font-sans">
                    영화에 대한 간단한 감상 키워드나 생각을 적어주시면, Gemini AI가 평론가 스타일 등의 고품격 상세 감상평으로 확장하여 전해 드립니다.
                  </p>

                  {/* If NO review is generated or saved, show generator input form */}
                  {!generatedReview ? (
                    <div className="space-y-4 bg-white/[0.01]/70 p-4 rounded-sm border border-white/5">
                      
                      {/* Short review textarea */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-mono tracking-wider text-white/40 uppercase">
                          나의 짧은 감상평 이나 키워드 (Draft Impression)
                        </label>
                        <textarea
                          value={shortReview}
                          onChange={(e) => {
                            setShortReview(e.target.value);
                            if (reviewError) setReviewError(null);
                          }}
                          placeholder="예시: 주인공들의 절제된 감정선이 깊은 감동을 주었음. 특히 마지막 후반전 오열하는 씬과 어우러지는 배경음악(OST)이 가히 압권이었다."
                          rows={3}
                          className="w-full bg-black/40 border border-white/10 rounded-sm p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition resize-none font-sans"
                        />
                      </div>

                      {/* Style selection */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-mono tracking-wider text-white/40 uppercase">
                          감상평 확장 연출 기법 (Select Style)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: "expert", label: "🎬 평론가 모드", desc: "깊이 있는 비평" },
                            { id: "emotional", label: "💓 감성 울림형", desc: "따뜻하고 서정적인 글" },
                            { id: "witty", label: "🔥 SNS 재치형", desc: "위트와 해시태그 가득" },
                            { id: "neutral", label: "✍️ 클래식 담백", desc: "정제된 객관적 감상" }
                          ].map((styleOption) => (
                            <button
                              key={styleOption.id}
                              onClick={() => setSelectedStyle(styleOption.id)}
                              className={`p-2.5 rounded-sm border text-left transition flex flex-col justify-between ${
                                selectedStyle === styleOption.id
                                  ? "bg-red-600/10 border-red-500 text-red-450"
                                  : "bg-black/35 border-white/5 hover:border-white/10 hover:bg-black/45 text-white/70 hover:text-white"
                              }`}
                            >
                              <span className="text-[11px] font-semibold block">{styleOption.label}</span>
                              <span className="text-[8px] text-white/30 block mt-0.5">{styleOption.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Error feedback */}
                      {reviewError && (
                        <p className="text-xs text-red-400 bg-red-950/20 border border-red-500/10 p-2.5 rounded-sm font-sans flex items-center gap-1.5">
                          <HelpCircle size={13} className="text-red-500 shrink-0" />
                          {reviewError}
                        </p>
                      )}

                      {/* Action generating button */}
                      <button
                        onClick={handleGenerateReview}
                        disabled={isGenerating || !shortReview.trim()}
                        className={`w-full py-3 px-4 rounded-sm border font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                          isGenerating
                            ? "bg-red-900/30 border-red-800/10 text-white/40 cursor-not-allowed"
                            : !shortReview.trim()
                            ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                            : "bg-red-600 border-red-500 hover:bg-red-700 active:bg-red-800 text-white hover:shadow-lg hover:shadow-red-600/10 cursor-pointer"
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-3.5 h-3.5 border border-white/20 border-t-white rounded-full animate-spin" />
                            영상을 분석해 감상문 집필 중... (Writing Review)
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            인공지능 감상평 완성하기
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    /* Display generated review result nicely inside cinema board */
                    <div className="space-y-4">
                      <div className="p-5 md:p-6 rounded-sm bg-[#050505] border border-red-900/30 relative overflow-hidden group">
                        {/* Glow effect */}
                        <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/5 blur-[50px] pointer-events-none rounded-full"></div>
                        
                        {/* Top styling badge */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4 text-[9px] font-mono tracking-widest text-white/30 uppercase">
                          <span className="flex items-center gap-1">
                            <Sparkles className="text-red-500 w-3 h-3 animate-pulse" />
                            GENERATED WRITING BY GEMINI 3.5-FLASH
                          </span>
                          <span className="bg-red-600/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-sm">
                            ★ SAVED LOCAL
                          </span>
                        </div>

                        {/* Content text */}
                        <div className="text-xs md:text-sm text-white/85 leading-relaxed font-sans whitespace-pre-line select-text">
                          {generatedReview}
                        </div>

                        {/* Actions block inside card */}
                        <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-white/5 text-[10px] font-mono">
                          <button
                            onClick={handleCopyReview}
                            className={`px-3.5 py-2 rounded-sm border transition flex items-center gap-1.5 shrink-0 ${
                              isCopying
                                ? "bg-emerald-950/20 border-emerald-555 text-emerald-400"
                                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                            }`}
                          >
                            {isCopying ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                복사 완료 (Copied)
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                클립보드 복사
                              </>
                            )}
                          </button>

                          <button
                            onClick={deleteReviewFromLocal}
                            className="px-3.5 py-2 rounded-sm border border-red-950/40 bg-red-950/10 text-red-400 hover:bg-red-950/20 hover:text-red-300 hover:border-red-500/20 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Trash2 size={12} />
                            새로 작성을 위해 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Footer of Profile sheets */}
          <div className="border-t border-white/10 bg-black/80 px-6 py-4 flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-[0.1em] shrink-0 relative z-10">
            <span>KOBIS DIRECT REAL-TIME CDN SYSTEM</span>
            {movieInfo && <span>PROFILE CD: {movieInfo.movieCd}</span>}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
