import { ConfigModuleOptions } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@src/shared/module/config/config.module';
import { UndefinedEnvironmentException } from '@src/shared/module/config/exception/config.exception';
import { ConfigService } from '@src/shared/module/config/service/config.service';

export const TEST_ENV_FILE = `${__dirname}/.env.sample`;

const getConfigService = async (options: ConfigModuleOptions): Promise<ConfigService> => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule.forRoot(options)],
  }).compile();

  return module.get<ConfigService>(ConfigService);
};

describe('ConfigModule', () => {
  it('does not throw UndefinedEnvironmentException when given envFilePath', () => {
    expect(() => {
      ConfigModule.forRoot({
        envFilePath: [TEST_ENV_FILE],
      });
    }).not.toThrow(UndefinedEnvironmentException);
  });

  it('parses environment variables', async () => {
    const service = await getConfigService({
      envFilePath: [TEST_ENV_FILE],
    });

    expect(service.get('PORT')).toEqual(12345);
  });
});
