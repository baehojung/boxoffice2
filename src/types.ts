export interface DailyBoxOfficeItem {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: "OLD" | "NEW";
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface BoxOfficeResult {
  boxofficeType: string;
  showRange: string;
  dailyBoxOfficeList: DailyBoxOfficeItem[];
}

export interface KobisBoxOfficeResponse {
  boxOfficeResult?: BoxOfficeResult;
}

export interface NationItem {
  nationNm: string;
}

export interface GenreItem {
  genreNm: string;
}

export interface DirectorItem {
  peopleNm: string;
  peopleNmEn: string;
}

export interface ActorItem {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface CompanyItem {
  companyCd: string;
  companyNm: string;
  companyPartNm: string;
}

export interface AuditItem {
  auditNo: string;
  watchGradeNm: string;
}

export interface MovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  showTm: string;
  prdtYear: string;
  openDt: string;
  prdtStatNm: string;
  typeNm: string;
  nations: NationItem[];
  genres: GenreItem[];
  directors: DirectorItem[];
  actors: ActorItem[];
  companys: CompanyItem[];
  audits: AuditItem[];
}

export interface MovieInfoResult {
  movieInfo: MovieInfo;
  source: string;
}

export interface KobisMovieInfoResponse {
  movieInfoResult?: MovieInfoResult;
}
