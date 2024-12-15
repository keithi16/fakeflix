import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1734220520697 implements MigrationInterface {
    name = 'Migration1734220520697'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59"`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "TvShow" DROP CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59"`);
        await queryRunner.query(`ALTER TABLE "TvShow" ADD CONSTRAINT "FK_e4e17f7e4fbf10e4bcd61aa8e59" FOREIGN KEY ("thumbnailId") REFERENCES "Thumbnail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
