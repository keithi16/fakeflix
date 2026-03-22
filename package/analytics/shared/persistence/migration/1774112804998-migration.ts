import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774112804998 implements MigrationInterface {
    name = 'Migration1774112804998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AnalyticsBingeSession" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "seriesContentId" uuid NOT NULL, "episodeCount" integer NOT NULL DEFAULT '0', "totalWatchTimeMs" bigint NOT NULL DEFAULT '0', "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3749d5db746ebc789920feb435a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_15c79631579afb1903c2155059" ON "AnalyticsBingeSession" ("userId", "startedAt") `);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsContentPerformance_contenttype_enum" AS ENUM('MOVIE', 'TV_EPISODE')`);
        await queryRunner.query(`CREATE TABLE "AnalyticsContentPerformance" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "contentId" uuid NOT NULL, "contentType" "public"."AnalyticsContentPerformance_contenttype_enum" NOT NULL, "totalViews" integer NOT NULL DEFAULT '0', "uniqueViewers" integer NOT NULL DEFAULT '0', "totalWatchTimeMs" bigint NOT NULL DEFAULT '0', "avgCompletionPercentage" numeric(5,2) NOT NULL DEFAULT '0', "completionCount" integer NOT NULL DEFAULT '0', "lastComputedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_bfa096da4cd8374afae5eae1afb" UNIQUE ("contentId"), CONSTRAINT "PK_1e028d4fdd5d9e885b0d4bd74ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_81c26acffdff593dd4f8cbfa31" ON "AnalyticsContentPerformance" ("contentType", "totalViews") `);
        await queryRunner.query(`CREATE TABLE "AnalyticsGenreAffinity" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "genre" character varying(100) NOT NULL, "affinityScore" numeric(5,2) NOT NULL DEFAULT '0', "totalWatchTimeMs" bigint NOT NULL DEFAULT '0', "contentCount" integer NOT NULL DEFAULT '0', "lastUpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_ad22af25d08c21fafe384093172" UNIQUE ("userId", "genre"), CONSTRAINT "PK_13906782851cbadade2deecc6c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_efa4e226d2e4b9e9f25fcd22e2" ON "AnalyticsGenreAffinity" ("userId", "affinityScore") `);
        await queryRunner.query(`CREATE TABLE "AnalyticsHeartbeat" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "contentId" uuid NOT NULL, "sessionId" uuid NOT NULL, "positionMs" bigint NOT NULL, "durationMs" bigint NOT NULL, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_62ae0f7f5907b68c206cb3d7d3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c3db7e7cf1c47c3b3f5741fcd3" ON "AnalyticsHeartbeat" ("userId", "contentId", "occurredAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_360b7f374dcee380cb9be8c05c" ON "AnalyticsHeartbeat" ("sessionId", "occurredAt") `);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsTrendingContent_contenttype_enum" AS ENUM('MOVIE', 'TV_EPISODE')`);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsTrendingContent_windowtype_enum" AS ENUM('DAILY', 'WEEKLY')`);
        await queryRunner.query(`CREATE TABLE "AnalyticsTrendingContent" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "contentId" uuid NOT NULL, "contentType" "public"."AnalyticsTrendingContent_contenttype_enum" NOT NULL, "windowType" "public"."AnalyticsTrendingContent_windowtype_enum" NOT NULL, "windowStart" TIMESTAMP WITH TIME ZONE NOT NULL, "windowEnd" TIMESTAMP WITH TIME ZONE NOT NULL, "viewCount" integer NOT NULL DEFAULT '0', "uniqueViewers" integer NOT NULL DEFAULT '0', "trendingScore" numeric(10,2) NOT NULL DEFAULT '0', "rank" integer NOT NULL DEFAULT '0', "computedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_0ecb0bffe2295a3ddb6aeb9326c" UNIQUE ("contentId", "windowType", "windowStart"), CONSTRAINT "PK_ae0118d77189bd9a328c9daef95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1f29705ada51ffdd654c0c5ba1" ON "AnalyticsTrendingContent" ("windowType", "rank") `);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsUserWatchHistory_contenttype_enum" AS ENUM('MOVIE', 'TV_EPISODE')`);
        await queryRunner.query(`CREATE TABLE "AnalyticsUserWatchHistory" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "contentId" uuid NOT NULL, "contentType" "public"."AnalyticsUserWatchHistory_contenttype_enum" NOT NULL, "lastWatchedPositionMs" bigint NOT NULL DEFAULT '0', "totalWatchTimeMs" bigint NOT NULL DEFAULT '0', "completionPercentage" numeric(5,2) NOT NULL DEFAULT '0', "completed" boolean NOT NULL DEFAULT false, "watchCount" integer NOT NULL DEFAULT '0', "firstWatchedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastWatchedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_0f9798df8e1b773eb071bb6343d" UNIQUE ("userId", "contentId"), CONSTRAINT "PK_795dc5b91e088dafb5adb3a5a28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4d5c0446a1ebf04dfc4ce702ef" ON "AnalyticsUserWatchHistory" ("userId", "lastWatchedAt") `);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsViewEvent_contenttype_enum" AS ENUM('MOVIE', 'TV_EPISODE')`);
        await queryRunner.query(`CREATE TYPE "public"."AnalyticsViewEvent_eventtype_enum" AS ENUM('PLAY', 'PAUSE', 'RESUME', 'STOP', 'COMPLETE')`);
        await queryRunner.query(`CREATE TABLE "AnalyticsViewEvent" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid NOT NULL, "contentId" uuid NOT NULL, "contentType" "public"."AnalyticsViewEvent_contenttype_enum" NOT NULL, "eventType" "public"."AnalyticsViewEvent_eventtype_enum" NOT NULL, "sessionId" uuid NOT NULL, "positionMs" bigint NOT NULL, "durationMs" bigint NOT NULL, "metadata" jsonb, "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_8b877b093e58164e9637db82926" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff3b7bc7c2383b67aa46cdd796" ON "AnalyticsViewEvent" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_19825db9ada32964afd9333b47" ON "AnalyticsViewEvent" ("contentId", "occurredAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_19548b9aa2495e91cb0314cf36" ON "AnalyticsViewEvent" ("userId", "occurredAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_19548b9aa2495e91cb0314cf36"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_19825db9ada32964afd9333b47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff3b7bc7c2383b67aa46cdd796"`);
        await queryRunner.query(`DROP TABLE "AnalyticsViewEvent"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsViewEvent_eventtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsViewEvent_contenttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d5c0446a1ebf04dfc4ce702ef"`);
        await queryRunner.query(`DROP TABLE "AnalyticsUserWatchHistory"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsUserWatchHistory_contenttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f29705ada51ffdd654c0c5ba1"`);
        await queryRunner.query(`DROP TABLE "AnalyticsTrendingContent"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsTrendingContent_windowtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsTrendingContent_contenttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_360b7f374dcee380cb9be8c05c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3db7e7cf1c47c3b3f5741fcd3"`);
        await queryRunner.query(`DROP TABLE "AnalyticsHeartbeat"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efa4e226d2e4b9e9f25fcd22e2"`);
        await queryRunner.query(`DROP TABLE "AnalyticsGenreAffinity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81c26acffdff593dd4f8cbfa31"`);
        await queryRunner.query(`DROP TABLE "AnalyticsContentPerformance"`);
        await queryRunner.query(`DROP TYPE "public"."AnalyticsContentPerformance_contenttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_15c79631579afb1903c2155059"`);
        await queryRunner.query(`DROP TABLE "AnalyticsBingeSession"`);
    }

}
