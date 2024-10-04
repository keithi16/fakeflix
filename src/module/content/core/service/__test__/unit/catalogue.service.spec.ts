import { faker } from '@faker-js/faker/locale/ar';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueService } from '@src/module/content/core/service/catalogue.service';

describe('CatalogueService', () => {
  let service: CatalogueService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CatalogueService],
    }).compile();

    service = module.get<CatalogueService>(CatalogueService);
  });

  describe('getVideoInfo', () => {
    it('returns the video with the specified ID', async () => {
      const id = faker.string.uuid();

      const result = await service.getVideoInfo(id);
      expect(result).toEqual(id);
    });
  });
});
