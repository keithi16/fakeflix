import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745790713772 implements MigrationInterface {
    name = 'Migration1745790713772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD "version" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP COLUMN "version"`);
    }

}
