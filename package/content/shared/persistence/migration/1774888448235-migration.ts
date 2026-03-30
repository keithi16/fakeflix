import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774888448235 implements MigrationInterface {
    name = 'Migration1774888448235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "genres" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "genres"`);
    }

}
