import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774984803035 implements MigrationInterface {
    name = 'Migration1774984803035'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "scheduledPublishAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "schedulingOutcome" character varying`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "archivedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "archivedBy" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "archivedBy"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "archivedAt"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "schedulingOutcome"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "scheduledPublishAt"`);
    }

}
