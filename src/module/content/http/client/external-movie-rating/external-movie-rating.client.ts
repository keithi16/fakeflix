import { Injectable } from '@nestjs/common';
import { ConfigService } from '@src/shared/module/config/config.service';
import { HttpClient } from '@src/shared/module/http-client/client/http.client';
import { HttpClientInternalException } from '@src/shared/module/http-client/exception/http-client.exception';

interface ApiResponse<T extends Record<string, any>> {
  results: Array<T>;
}

@Injectable()
export class ExternalMovieRatingClient {
  constructor(
    private readonly configService: ConfigService,
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
    const movieDbApiToken = this.configService.get('movieDb').apiToken;
    const movieDbApiUrl = this.configService.get('movieDb').url;
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
