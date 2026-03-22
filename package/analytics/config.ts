import { ConfigException, environmentSchema } from '@tlc/shared-module/config';
import { z } from 'zod';

const databaseSchema = z.object({
  host: z.string(),
  database: z.string(),
  password: z.string(),
  port: z.coerce.number(),
  url: z.string().startsWith('postgresql://'),
  username: z.string(),
});

const redisSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
});

const analyticsThresholdsSchema = z.object({
  bingeEpisodeCount: z.coerce.number().default(3),
  bingeGapMinutes: z.coerce.number().default(30),
  trendingComputationIntervalHours: z.coerce.number().default(1),
  genreAffinityRecomputationIntervalHours: z.coerce.number().default(6),
});

const analyticsSchema = z.object({
  database: databaseSchema,
  redis: redisSchema,
  thresholds: analyticsThresholdsSchema,
});

export const configSchema = z.object({
  env: environmentSchema,
  analytics: analyticsSchema,
});

export type AnalyticsConfig = z.infer<typeof configSchema>;

export type Config = z.infer<typeof configSchema>;

export const factory = (): Config => {
  const result = configSchema.safeParse({
    env: process.env.NODE_ENV,
    analytics: {
      database: {
        host: process.env.ANALYTICS_DATABASE_HOST,
        database: process.env.ANALYTICS_DATABASE_NAME,
        password: process.env.ANALYTICS_DATABASE_PASSWORD,
        port: process.env.ANALYTICS_DATABASE_PORT,
        url: `postgresql://${encodeURIComponent(process.env.ANALYTICS_DATABASE_USERNAME ?? '')}:${encodeURIComponent(process.env.ANALYTICS_DATABASE_PASSWORD ?? '')}@${process.env.ANALYTICS_DATABASE_HOST}:${process.env.ANALYTICS_DATABASE_PORT}/${process.env.ANALYTICS_DATABASE_NAME}`,
        username: process.env.ANALYTICS_DATABASE_USERNAME,
      },
      redis: {
        host: process.env.ANALYTICS_REDIS_HOST ?? 'localhost',
        port: process.env.ANALYTICS_REDIS_PORT ?? 6379,
      },
      thresholds: {
        bingeEpisodeCount: process.env.ANALYTICS_BINGE_EPISODE_COUNT,
        bingeGapMinutes: process.env.ANALYTICS_BINGE_GAP_MINUTES,
        trendingComputationIntervalHours: process.env.ANALYTICS_TRENDING_INTERVAL_HOURS,
        genreAffinityRecomputationIntervalHours: process.env.ANALYTICS_GENRE_AFFINITY_INTERVAL_HOURS,
      },
    },
  });

  if (result.success) {
    return result.data;
  }

  throw new ConfigException(`Invalid application configuration: ${result.error.message}`);
};
