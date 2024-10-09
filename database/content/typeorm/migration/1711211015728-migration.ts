import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1711211015728 implements MigrationInterface {
    name = 'Migration1711211015728'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TvShow" ADD "contentId" uuid`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "UQ_b6ac53aff4b7200e4b01ca43a9c" UNIQUE ("contentId")`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD "thumbnailId" uuid`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "UQ_e4e17f7e4fbf10e4bcd61aa8e59" UNIQUE ("thumbnailId")`);
        await queryRunner.query(`ALTER TABLE "episode" ADD "thumbnailId" uuid`);
        await queryRunner.query(`ALTER TABLE "episode" ADD CONSTRAINT "UQ_6c57a6d8be1b8001ee31093ee99" UNIQUE ("thumbnailId")`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "FK_b6ac53aff4b7200e4b01ca43a9c" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "episode" ADD CONSTRAINT "FK_6c57a6d8be1b8001ee31093ee99" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "episode" DROP CONSTRAINT "FK_6c57a6d8be1b8001ee31093ee99"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "FK_b6ac53aff4b7200e4b01ca43a9c"`);
        await queryRunner.query(`ALTER TABLE "episode" DROP CONSTRAINT "UQ_6c57a6d8be1b8001ee31093ee99"`);
        await queryRunner.query(`ALTER TABLE "episode" DROP COLUMN "thumbnailId"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "UQ_e4e17f7e4fbf10e4bcd61aa8e59"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP COLUMN "thumbnailId"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "UQ_b6ac53aff4b7200e4b01ca43a9c"`);
        await queryRunner.query(`ALTER TABLE "TvShow" DROP COLUMN "contentId"`);
    }

}
