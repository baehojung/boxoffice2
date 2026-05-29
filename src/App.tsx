/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Users,
  Search,
  RotateCcw,
  Film,
  Award,
  DollarSign,
  HelpCircle,
  Tv,
  ArrowLeft,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { DailyBoxOfficeItem, KobisBoxOfficeResponse } from "./types";
import { MovieDetailModal } from "./components/MovieDetailModal";

// Helper: Get formatted date in YYYY-MM-DD
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToString(d);
};

export default function App() {
  const yesterday = getYesterdayString();
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modal State
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [selectedMovieNm, setSelectedMovieNm] = useState<string>("");

  const fetchBoxOffice = async () => {
    setLoading(true);
    setError(null);
    
    // Remove hyphens (YYYY-MM-DD -> YYYYMMDD)
    const targetDt = selectedDate.replace(/-/g, "");
    
    try {
      const response = await fetch(`/api/boxoffice?date=${targetDt}`);
      if (!response.ok) {
        throw new Error("서버로부터 데이터를 불러오는데 실패했습니다.");
      }
      const data: KobisBoxOfficeResponse = await response.json();
      
      if (data.boxOfficeResult?.dailyBoxOfficeList) {
        setBoxOfficeList(data.boxOfficeResult.dailyBoxOfficeList);
      } else {
        setBoxOfficeList([]);
        setError("해당 날짜의 박스오피스 정보가 없습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError("영화진흥위원회 API 데이터 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch box office data whenever selectedDate changes
  useEffect(() => {
    fetchBoxOffice();
  }, [selectedDate]);

  // Handle previous day click
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatDateToString(current));
    setSearchQuery("");
  };

  // Handle next day click (up to yesterday)
  const handleNextDay = () => {
    const current = new Date(selectedDate);
    const yestDate = new Date(yesterday);
    if (current < yestDate) {
      current.setDate(current.getDate() + 1);
      setSelectedDate(formatDateToString(current));
      setSearchQuery("");
    }
  };

  // Quick jump date preset helpers
  const handlePresetChange = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSelectedDate(formatDateToString(d));
    setSearchQuery("");
  };

  // Convert spectators count and sales amount formatting
  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  const formatCurrency = (amtStr: string) => {
    const num = parseInt(amtStr, 10);
    if (isNaN(num)) return "0원";
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억원`;
    }
    return `${(num / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}만원`;
  };

  // Custom filter of loaded daily lists
  const filteredList = boxOfficeList.filter((movie) =>
    movie.movieNm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Total summary of today loaded movie statistics
  const totalAudience = filteredList.reduce((acc, curr) => acc + parseInt(curr.audiCnt || "0", 10), 0);
  const totalSales = filteredList.reduce((acc, curr) => acc + parseInt(curr.salesAmt || "0", 10), 0);

  // Get index rank fluctuation elements styling
  const renderRankFluctuation = (rankOldAndNew: string, intensity: string) => {
    if (rankOldAndNew === "NEW") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-extrabold tracking-tight rounded bg-red-600/10 text-red-500 border border-red-500/20 shadow-sm">
          NEW
        </span>
      );
    }

    const value = parseInt(intensity, 10);
    if (isNaN(value) || value === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono text-white/30 bg-white/5 rounded">
          STAY
        </span>
      );
    }

    if (value > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold text-red-400 bg-red-500/10 rounded">
          ▲ {value}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 rounded">
        ▼ {Math.abs(value)}
      </span>
    );
  };

  // Peak maximum audience daily standardizer for visual share percentages
  const maxAudi = boxOfficeList.length > 0 ? Math.max(...boxOfficeList.map(m => parseInt(m.audiCnt || "0", 10))) : 1;

  // Format date display (e.g., 2026-05-28 -> 2026.05.28)
  const formattedDateDisplay = selectedDate.replace(/-/g, ".");

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col font-sans selection:bg-red-650/40 selection:text-white pb-12">
      
      {/* Top Header Navigation - Elegant Dark Style */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-10 shrink-0 sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-sm flex items-center justify-center font-serif font-black text-white text-lg">
            K
          </div>
          <h1 className="text-xl md:text-2xl font-serif tracking-tight font-semibold text-white">
            CINE<span className="text-red-600">BOX</span>
          </h1>
        </div>
        
        {/* Date Selector component & Reload Button */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">SELECTED DATE</span>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 gap-2.5">
              <button 
                id="header-prev-btn"
                onClick={handlePrevDay}
                className="hover:text-red-500 text-white/40 transition p-1"
                title="이전 날로 이동"
              >
                <ArrowLeft size={13} />
              </button>
              <span className="text-xs md:text-sm font-mono font-semibold tracking-wider text-white">
                {formattedDateDisplay}
              </span>
              <button 
                id="header-next-btn"
                onClick={handleNextDay}
                disabled={selectedDate === yesterday}
                className={`transition p-1 ${selectedDate === yesterday ? 'text-white/10 cursor-not-allowed' : 'hover:text-red-500 text-white/40'}`}
                title="다음 날로 이동 (어제 완료 건까지)"
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-white/10"></div>
          
          <button 
            id="header-refresh-btn"
            onClick={fetchBoxOffice}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-4 py-2 rounded-sm text-xs font-semibold transition uppercase tracking-wider flex items-center gap-1.5"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>
      </header>

      {/* Main Grid content matching aesthetic with full desktop bounds */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive Control Dashboard (4 spans) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Calendar Picker component */}
          <div id="controls-panel" className="p-6 rounded-sm bg-[#0a0a0a] border border-white/10 relative overflow-hidden">
            {/* Subtle glow background element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full pointer-events-none"></div>
            
            <div className="relative z-15 space-y-5">
              <div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white/50 mb-1 flex items-center gap-2">
                  <Calendar className="text-red-600 w-3.5 h-3.5" />
                  DATE FILTER
                </h3>
                <p className="text-white/40 text-xs font-sans">
                  조회하고자 하는 날짜를 달력으로 직접 변경합니다.
                </p>
              </div>

              {/* Native Input Wrapper */}
              <div className="relative">
                <input
                  id="target-date-picker"
                  type="date"
                  value={selectedDate}
                  max={yesterday}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSearchQuery("");
                  }}
                  className="w-full font-mono text-sm font-medium bg-white/5 border border-white/10 rounded-sm p-3.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition cursor-pointer"
                />
              </div>

              {/* Presets and bookmarks list */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono tracking-wider text-white/30 uppercase">
                  QUICK NAVIGATE PRESETS
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="preset-yesterday"
                    onClick={() => handlePresetChange(1)}
                    className={`py-2 px-3 text-left rounded-sm text-xs font-medium border font-mono tracking-tight transition ${
                      selectedDate === yesterday
                        ? "bg-red-600 border-red-500 text-white"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    어제 ({yesterday.substring(5)})
                  </button>
                  <button
                    id="preset-day-before"
                    onClick={() => handlePresetChange(2)}
                    className="py-2 px-3 text-left rounded-sm text-xs font-medium border font-mono tracking-tight bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition"
                  >
                    그저께
                  </button>
                  <button
                    id="preset-one-week"
                    onClick={() => handlePresetChange(7)}
                    className="py-2 px-3 text-left rounded-sm text-xs font-medium border font-mono tracking-tight bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition"
                  >
                    일주일 전
                  </button>
                  <button
                    id="preset-one-month"
                    onClick={() => handlePresetChange(30)}
                    className="py-2 px-3 text-left rounded-sm text-xs font-medium border font-mono tracking-tight bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition"
                  >
                    한달 전
                  </button>
                </div>
              </div>

              {/* Footer resetting trigger point */}
              <button
                id="reset-filter-btn"
                onClick={() => {
                  setSelectedDate(yesterday);
                  setSearchQuery("");
                }}
                className="w-full py-2.5 px-4 rounded-sm border border-white/10 hover:border-white/20 hover:bg-white/5 text-[#e5e5e5] text-xs font-medium flex items-center justify-center gap-1.5 transition uppercase tracking-wide"
              >
                <RotateCcw size={11} className="text-red-500" />
                Reset To Default (Yesterday)
              </button>
            </div>
          </div>

          {/* Quick Metrics and financial charts */}
          {!loading && !error && boxOfficeList.length > 0 && (
            <div id="stats-panel" className="p-6 rounded-sm bg-[#0a0a0a] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600/5 blur-[50px] rounded-full pointer-events-none"></div>

              <div className="relative z-15 space-y-4">
                <div>
                  <span className="font-mono text-[9px] font-bold text-red-500 tracking-widest uppercase block mb-1">
                    PERFORMANCE METRICS
                  </span>
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white/50">
                    Day Statistics
                  </h3>
                </div>

                {/* Statistics Box layouts */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-sm bg-white/5 border border-white/10 flex flex-col justify-between min-h-[90px]">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <Users size={11} className="text-red-500" />
                      <span className="text-[9px] uppercase font-mono tracking-wider">Total Audience</span>
                    </div>
                    <div>
                      <span className="font-serif italic text-2xl text-white">
                        {formatNumber(totalAudience.toString())}
                      </span>
                      <span className="text-[10px] text-white/40 ml-1">명</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-sm bg-white/5 border border-white/10 flex flex-col justify-between min-h-[90px]">
                    <div className="flex items-center gap-1.5 text-white/40 mb-1">
                      <DollarSign size={11} className="text-red-500" />
                      <span className="text-[9px] uppercase font-mono tracking-wider">Revenue</span>
                    </div>
                    <div>
                      <span className="font-serif italic text-2xl text-red-500">
                        {formatCurrency(totalSales.toString())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Information Disclaimer */}
                <p className="text-[10px] font-sans text-white/40 leading-relaxed bg-black/40 p-3 rounded border border-white/5">
                  데이터는 영화진흥위원회(KOBIS) 통합전산망의 일일 전송정보를 실시간으로 합산 적용한 오피셜 인텔리전스 통계 자료입니다.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Right Rankings list display (8 spans) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Fine Tuning Filter Box */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/50 self-start sm:self-center">
              DAILY RANKINGS ({filteredList.length})
            </h2>
            
            <div className="relative w-full sm:w-72">
              <input
                id="box-office-search"
                type="text"
                placeholder="결과 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-xs rounded-sm p-3 pl-9 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500 transition font-mono"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={12} />
            </div>
          </div>

          {/* Conditional state templates */}
          {loading ? (
            <div className="p-24 rounded-sm bg-[#0a0a0a] border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-5 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-red-650 animate-spin" />
                <Film className="absolute text-red-500 animate-pulse" size={16} />
              </div>
              <h3 className="font-serif italic text-lg text-white">로드 중입니다...</h3>
              <p className="text-xs text-white/40 font-mono tracking-wider uppercase mt-1">Fetching records from KOBIS CDN</p>
            </div>
          ) : error ? (
            <div className="p-16 rounded-sm bg-[#0a0a0a] border border-white/10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-800/20 flex items-center justify-center text-red-500 mb-4">
                <HelpCircle size={18} />
              </div>
              <h3 className="font-serif text-lg text-white">데이터가 부재하거나 로딩 실패</h3>
              <p className="text-xs text-white/40 max-w-sm mt-1 mb-6">{error}</p>
              <button
                id="retry-fetch-btn"
                onClick={() => {
                  setSelectedDate(yesterday);
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-sm text-xs font-mono tracking-wider transition border border-white/10"
              >
                GO BACK TO YESTERDAY
              </button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-16 rounded-sm bg-[#0a0a0a] border border-white/10 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-4">
                <Minus size={18} />
              </div>
              <h4 className="font-serif text-base text-white">검색된 영화 정보가 없습니다</h4>
              <p className="text-xs text-white/30 mt-1 mb-6 uppercase tracking-wider font-mono">
                No matches found under criterion: "{searchQuery}"
              </p>
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery("")}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-sm text-xs font-mono tracking-wider transition border border-white/10"
              >
                RESET QUERY
              </button>
            </div>
          ) : (
            /* Elegant List items */
            <div className="space-y-3">
              {filteredList.map((movie, index) => {
                const dailyAudi = parseInt(movie.audiCnt || "0", 10);
                const percentageWidth = Math.min(100, Math.max(3, (dailyAudi / maxAudi) * 100));
                
                // Formatted Rank numbers (padded like 01, 02)
                const rankNumString = movie.rank.padStart(2, '0');

                return (
                  <motion.div
                    key={movie.movieCd}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => {
                      setSelectedMovieCd(movie.movieCd);
                      setSelectedMovieNm(movie.movieNm);
                    }}
                    className={`group cursor-pointer p-6 rounded-sm bg-[#0a0a0a] text-white/90 border border-white/10 hover:bg-white/[0.02]/80 hover:border-red-650/45 transition duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative ${
                      index === 0 ? "border-l-4 border-l-red-650" : ""
                    }`}
                  >
                    
                    {/* Ranking & details row left block */}
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      {/* Serif stylized rank design */}
                      <span className="text-4xl font-serif italic text-white/20 group-hover:text-red-600/60 transition min-w-[45px]">
                        {rankNumString}
                      </span>

                      {/* Movie main metadata detail block */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Fluctuation indicator */}
                        <div className="flex items-center gap-2">
                          {renderRankFluctuation(movie.rankOldAndNew, movie.rankInten)}
                          {index === 0 && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-red-600/10 text-red-500 border border-red-500/20 px-1 py-0.2 rounded-sm">
                              TOP LEADER
                            </span>
                          )}
                        </div>

                        {/* Title typography */}
                        <h3 className="font-sans font-bold text-base md:text-lg text-white group-hover:text-red-500 transition leading-snug truncate">
                          {movie.movieNm}
                        </h3>

                        {/* Metadata counts */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/40">
                          <span className="font-mono flex items-center gap-1">
                            <Award size={11} className="text-red-500" />
                            {movie.openDt ? movie.openDt.replace(/-/g, ".") : "미정"} 개봉
                          </span>
                          <span className="text-white/10">|</span>
                          <span className="font-mono text-[11px]">
                            누적 {formatNumber(movie.audiAcc)} 명
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Graph visual details and metrics summary column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t border-white/5 sm:border-0">
                      
                      {/* Text audience values */}
                      <div className="sm:text-right">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider block font-mono">Daily Audience</span>
                        <div className="flex items-center sm:justify-end gap-1 font-mono">
                          <span className="text-sm font-bold text-white">
                            {formatNumber(movie.audiCnt)}
                          </span>
                          <span className="text-[10px] text-white/40">명</span>
                        </div>
                      </div>

                      {/* visual loading bar indicator */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 bg-white/5 h-1 rounded-full overflow-hidden block">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              index === 0 ? "bg-red-600" : "bg-white/30 group-hover:bg-red-500/50"
                            }`}
                            style={{ width: `${percentageWidth}%` }}
                          />
                        </div>
                        <span className="font-mono text-[9px] text-white/40 w-5">
                          {percentageWidth.toFixed(0)}%
                        </span>
                      </div>

                    </div>

                    {/* Action trigger chevron floating indicator */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition duration-150 text-red-500 hidden md:block">
                      <ChevronRight size={16} />
                    </div>

                  </motion.div>
                );
              })}

              {/* Page footer note */}
              <div className="p-4 rounded-sm bg-black/40 border border-white/5 text-center font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] flex justify-between gap-2">
                <span>Data Target Period: {selectedDate.replace(/-/g, ".")} 24:00 KST</span>
                <span>Active records: {filteredList.length} Units</span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* System Footer of Elegant Cinema Box site */}
      <footer className="h-16 mt-12 bg-black border-t border-white/5 px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em] shrink-0 text-center sm:text-left">
        <div>KOBIS OPEN API CONNECTED • SYNC: {yesterday}</div>
        <div>© 2026 CINEBOX INTELLIGENCE SYSTEM</div>
      </footer>

      {/* Slide detailed movie overlay dialog popup modal */}
      {selectedMovieCd && (
        <MovieDetailModal
          movieCd={selectedMovieCd}
          movieNm={selectedMovieNm}
          onClose={() => {
            setSelectedMovieCd(null);
            setSelectedMovieNm("");
          }}
        />
      )}
    </div>
  );
}
