import { Injectable } from '@nestjs/common';
import { ConfigService } from '@tlc/shared-module/config';
import { HttpClient, HttpClientInternalException } from '@tlc/shared-module/http-client';
import { ContentConfig } from '../../../../config';
import { ExternalMovieRatingAdapter } from '../../../core/adapter/external-movie-rating.adapter.interface';

interface ApiResponse<T extends Record<string, any>> {
  results: Array<T>;
}

@Injectable()
export class ExternalMovieRatingClient implements ExternalMovieRatingAdapter {
  constructor(
    private readonly configService: ConfigService<ContentConfig>,
    private readonly httpClient: HttpClient
  ) {}

  async getRating(title: string): Promise<number | undefined> {
    const keywordId = await this.stringToKeywordId(title);
    if (!keywordId) {
      return;
    }

    const apiResponse = await this.fetch<{ vote_average: number }>(
      `discover/movie?with_keywords=${keywordId}`
    );

    return apiResponse.results.length > 0
      ? apiResponse.results[0].vote_average
      : undefined;
  }

  private async stringToKeywordId(keyword: string): Promise<string | undefined> {
    const apiResponse = await this.fetch<{ id: string }>(
      `/search/keyword?query=${encodeURI(keyword)}&page=1`
    );

    return apiResponse.results.length > 0 ? apiResponse.results[0].id : undefined;
  }

  private async fetch<T extends Record<string, any>>(
    path: string
  ): Promise<ApiResponse<T>> {
    const movieDbApiToken = this.configService.get('content.movieDb').apiToken;
    const movieDbApiUrl = this.configService.get('content.movieDb').url;
    const url = `${movieDbApiUrl}${path}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${movieDbApiToken}`,
      },
    };

    try {
      const response = await this.httpClient.get<ApiResponse<T>>(url, options);
      return response;
    } catch (error) {
      throw new HttpClientInternalException(
        `Error fetching external movie rating: ${error}`
      );
    }
  }
}
