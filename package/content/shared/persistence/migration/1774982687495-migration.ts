import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774982687495 implements MigrationInterface {
    name = 'Migration1774982687495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_previousstate_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_newstate_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "ContentTransition" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "contentId" uuid NOT NULL, "previousState" "public"."ContentTransition_previousstate_enum" NOT NULL, "newState" "public"."ContentTransition_newstate_enum" NOT NULL, "triggeredBy" character varying NOT NULL, "reason" character varying, "transitionedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ffb7f00f08b53fe5fef07704028" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ContentItem_publishingstatus_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ADD "publishingStatus" "public"."ContentItem_publishingstatus_enum" NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`UPDATE "ContentItem" SET "publishingStatus" = 'PUBLISHED' WHERE "publishingStatus" = 'DRAFT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ContentItem" DROP COLUMN "publishingStatus"`);
        await queryRunner.query(`DROP TYPE "public"."ContentItem_publishingstatus_enum"`);
        await queryRunner.query(`DROP TABLE "ContentTransition"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_newstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_previousstate_enum"`);
    }

}
