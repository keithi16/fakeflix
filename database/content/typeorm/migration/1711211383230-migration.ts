import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1711211383230 implements MigrationInterface {
    name = 'Migration1711211383230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Video" ADD "episodeId" uuid`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "UQ_ce049b6bf5d3e5aee0f3dbd8dc0" UNIQUE ("episodeId")`);
        await queryRunner.query(`ALTER TABLE "Movie" ADD "thumbnailId" uuid`);
        await queryRunner.query(`ALTER TABLE "Movie" ADD CONSTRAINT "UQ_a20dc7d8915f1caf6079301b10e" UNIQUE ("thumbnailId")`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0" FOREIGN KEY ("episodeId") REFERENCES "episode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Movie" ADD CONSTRAINT "FK_a20dc7d8915f1caf6079301b10e" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Movie" DROP CONSTRAINT "FK_a20dc7d8915f1caf6079301b10e"`);
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "FK_ce049b6bf5d3e5aee0f3dbd8dc0"`);
        await queryRunner.query(`ALTER TABLE "Movie" DROP CONSTRAINT "UQ_a20dc7d8915f1caf6079301b10e"`);
        await queryRunner.query(`ALTER TABLE "Movie" DROP COLUMN "thumbnailId"`);
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "UQ_ce049b6bf5d3e5aee0f3dbd8dc0"`);
        await queryRunner.query(`ALTER TABLE "Video" DROP COLUMN "episodeId"`);
    }

}
