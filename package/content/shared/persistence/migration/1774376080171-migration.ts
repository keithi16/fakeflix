import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774376080171 implements MigrationInterface {
    name = 'Migration1774376080171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Thumbnail" RENAME TO "ContentThumbnail"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" RENAME TO "ContentVideoMetadata"`);
        await queryRunner.query(`ALTER TABLE "Video" RENAME TO "ContentVideo"`);
        await queryRunner.query(`ALTER TYPE "public"."Content_type_enum" RENAME TO "ContentItem_type_enum"`);
        await queryRunner.query(`ALTER TABLE "Content" RENAME TO "ContentItem"`);
        await queryRunner.query(`ALTER TABLE "Episode" RENAME TO "ContentEpisode"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentEpisode" RENAME TO "Episode"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" RENAME TO "Content"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentItem_type_enum" RENAME TO "Content_type_enum"`);
        await queryRunner.query(`ALTER TABLE "ContentVideo" RENAME TO "Video"`);
        await queryRunner.query(`ALTER TABLE "ContentVideoMetadata" RENAME TO "VideoMetadata"`);
        await queryRunner.query(`ALTER TABLE "ContentThumbnail" RENAME TO "Thumbnail"`);
    }

}
