export interface ContentCatalogItem {
  id: string;
  title: string;
  type: string;
  genres: string[];
  releaseDate: Date | null;
}

export interface ContentCatalogApi {
  findAllWithGenres(): Promise<ContentCatalogItem[]>;
}

export const ContentCatalogApi = Symbol('ContentCatalogApi');
