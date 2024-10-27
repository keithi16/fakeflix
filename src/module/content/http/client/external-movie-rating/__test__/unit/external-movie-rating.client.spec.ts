import { Test, TestingModule } from '@nestjs/testing';
import { ExternalMovieRatingClient } from '@src/module/content/http/client/external-movie-rating/external-movie-rating.client';
import { ConfigService } from '@src/shared/module/config/config.service';
import { HttpClient } from '@src/shared/module/http-client/client/http.client';

describe('ExternalMovieRatingClient', () => {
  let service: ExternalMovieRatingClient;
  const mockedHttpClientGet = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalMovieRatingClient,
        {
          provide: HttpClient,
          useValue: {
            get: mockedHttpClientGet,
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => ({ apiToken: 'token', url: 'url' })) },
        },
      ],
    }).compile();

    service = module.get<ExternalMovieRatingClient>(ExternalMovieRatingClient);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined if keywordId is not found', async () => {
    mockedHttpClientGet.mockResolvedValue({ results: [] });
    expect(await service.getRating('title')).toBeUndefined();
  });

  it('returns the vote average if keywordId is found', async () => {
    //first returns a keyword id
    mockedHttpClientGet.mockResolvedValueOnce({
      results: [
        {
          id: '1',
        },
      ],
    });
    //then returns a vote average
    mockedHttpClientGet.mockResolvedValue({ results: [{ vote_average: 7.5 }] });
    expect(await service.getRating('title')).toBe(7.5);
  });

  it('returns undefined if not titles are found', async () => {
    //first returns a keyword id
    mockedHttpClientGet.mockResolvedValueOnce({
      results: [
        {
          id: '1',
        },
      ],
    });
    //then returns a vote average
    mockedHttpClientGet.mockResolvedValue({ results: [] });
    expect(await service.getRating('title')).toBe(undefined);
  });
});
