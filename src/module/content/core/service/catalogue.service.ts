import { Injectable } from '@nestjs/common';

export interface ContentFilterOpts {
  movie: string;
}

@Injectable()
export class CatalogueService {
  async listContent(): Promise<any[]> {
    return [];
  }

  async getVideoInfo(videoId: string): Promise<any | null> {
    return videoId;
  }
}
