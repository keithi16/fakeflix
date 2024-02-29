export interface ContentMediaInput {
  contentId: string;
  title: string;
  description: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  movieId: string;
  metadata: {
    url: string;
    duration: number;
    sizeInKb: number;
    videoId: string;
    createdAt: Date;
    updatedAt: Date;
    thumbnail?: {
      url: string;
      thumbnailId: string;
    };
  };
}

export class ContentMedia {
  contentId: string;
  title: string;
  description: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  movieId: string;
  metadata: {
    url: string;
    duration: number;
    sizeInKb: number;
    videoId: string;
    createdAt: Date;
    updatedAt: Date;
    thumbnail?: {
      url: string;
      thumbnailId: string;
    };
  };

  constructor({
    contentId,
    title,
    description,
    type,
    createdAt,
    updatedAt,
    movieId,
    metadata,
  }: ContentMediaInput) {
    this.contentId = contentId;
    this.title = title;
    this.description = description;
    this.type = type;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.movieId = movieId;
    this.metadata = metadata;
  }
}
