export type IntegratedArticle = {
  title: string;
  url: string;
  source: string;
  snippet: string | null;
  published_at: string | null;
};

export function searchGuardian(keyword: string): Promise<IntegratedArticle[]>;
export function searchNYT(keyword: string): Promise<IntegratedArticle[]>;
export function searchNewsAPI(keyword: string): Promise<IntegratedArticle[]>;
export function searchBingNews(keyword: string): Promise<IntegratedArticle[]>;
export function searchGDELT(keyword: string): Promise<IntegratedArticle[]>;
export function searchReutersRSS(keyword: string): Promise<IntegratedArticle[]>;
export function searchAPRSS(keyword: string): Promise<IntegratedArticle[]>;
export function searchBBCRSS(keyword: string): Promise<IntegratedArticle[]>;
export function searchReddit(keyword: string): Promise<IntegratedArticle[]>;
export function searchHN(keyword: string): Promise<IntegratedArticle[]>;
export function searchAllSources(keyword: string): Promise<IntegratedArticle[]>;
