import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745273878245 implements MigrationInterface {
    name = 'Migration1745273878245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP COLUMN "ageRatingCategories"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD "ageRatingCategories" text array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP COLUMN "ageRatingCategories"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD "ageRatingCategories" text`);
    }

}
