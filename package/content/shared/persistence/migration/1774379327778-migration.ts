import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774379327778 implements MigrationInterface {
    name = 'Migration1774379327778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentVideoMetadata" DROP CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP CONSTRAINT "FK_46efd1060cb7a7c545b06120d14"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP CONSTRAINT "FK_9eb0969c366defe748854d453a6"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "FK_3dc5f16eddbe518eff23f510ec6"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "FK_7153938ad76137550256fd3b40a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_318d7f4cb6dd2218ccf69b0941"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP CONSTRAINT "REL_46efd1060cb7a7c545b06120d1"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP COLUMN "movieId"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP CONSTRAINT "REL_ce049b6bf5d3e5aee0f3dbd8dc"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" DROP COLUMN "episodeId"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "videoId" uuid`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD CONSTRAINT "UQ_ecb8c93c4d7db80a67f2e2aaf6d" UNIQUE ("videoId")`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD "videoId" uuid`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "UQ_ce7212aa1f1549ae9dc82f32fd2" UNIQUE ("videoId")`);
        await queryRunner.query(`CREATE INDEX "IDX_f1ba942fb6f4f8de3487f2fad3" ON "ContentItem" ("type") `);
        await queryRunner.query(`ALTER TABLE "ContentVideoMetadata" ADD CONSTRAINT "FK_2e80e838521ca1d08b16819cf1c" FOREIGN KEY ("videoId") REFERENCES "ContentVideo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD CONSTRAINT "FK_ecb8c93c4d7db80a67f2e2aaf6d" FOREIGN KEY ("videoId") REFERENCES "ContentVideo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD CONSTRAINT "FK_2b13abbd88a4174760d8dfeadab" FOREIGN KEY ("thumbnailId") REFERENCES "ContentThumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "FK_a31181b550bd1ba90f3fb144cb3" FOREIGN KEY ("tvShowId") REFERENCES "ContentItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "FK_0e1c9d48138c1e1333824a66f32" FOREIGN KEY ("thumbnailId") REFERENCES "ContentThumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "FK_ce7212aa1f1549ae9dc82f32fd2" FOREIGN KEY ("videoId") REFERENCES "ContentVideo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "FK_ce7212aa1f1549ae9dc82f32fd2"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "FK_0e1c9d48138c1e1333824a66f32"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "FK_a31181b550bd1ba90f3fb144cb3"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP CONSTRAINT "FK_2b13abbd88a4174760d8dfeadab"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP CONSTRAINT "FK_ecb8c93c4d7db80a67f2e2aaf6d"`);
        await queryRunner.query(`ALTER TABLE "ContentVideoMetadata" DROP CONSTRAINT "FK_2e80e838521ca1d08b16819cf1c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1ba942fb6f4f8de3487f2fad3"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP CONSTRAINT "UQ_ce7212aa1f1549ae9dc82f32fd2"`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" DROP COLUMN "videoId"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP CONSTRAINT "UQ_ecb8c93c4d7db80a67f2e2aaf6d"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "videoId"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD "episodeId" uuid`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD CONSTRAINT "REL_ce049b6bf5d3e5aee0f3dbd8dc" UNIQUE ("episodeId")`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD "movieId" uuid`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD CONSTRAINT "REL_46efd1060cb7a7c545b06120d1" UNIQUE ("movieId")`);
        await queryRunner.query(`CREATE INDEX "IDX_318d7f4cb6dd2218ccf69b0941" ON "ContentItem" ("type") `);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "FK_7153938ad76137550256fd3b40a" FOREIGN KEY ("thumbnailId") REFERENCES "ContentThumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentEpisode" ADD CONSTRAINT "FK_3dc5f16eddbe518eff23f510ec6" FOREIGN KEY ("tvShowId") REFERENCES "ContentItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD CONSTRAINT "FK_9eb0969c366defe748854d453a6" FOREIGN KEY ("thumbnailId") REFERENCES "ContentThumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0" FOREIGN KEY ("episodeId") REFERENCES "ContentEpisode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" ADD CONSTRAINT "FK_46efd1060cb7a7c545b06120d14" FOREIGN KEY ("movieId") REFERENCES "ContentItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ContentVideoMetadata" ADD CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0" FOREIGN KEY ("videoId") REFERENCES "ContentVideo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
