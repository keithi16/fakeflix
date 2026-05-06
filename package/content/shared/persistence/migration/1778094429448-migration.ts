import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1778094429448 implements MigrationInterface {
    name = 'Migration1778094429448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."ContentItem_publishingstatus_enum" RENAME TO "ContentItem_publishingstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ContentItem_publishingstatus_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" TYPE "public"."ContentItem_publishingstatus_enum" USING "publishingStatus"::"text"::"public"."ContentItem_publishingstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."ContentItem_publishingstatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentTransition_previousstate_enum" RENAME TO "ContentTransition_previousstate_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_previousstate_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "ContentTransition" ALTER COLUMN "previousState" TYPE "public"."ContentTransition_previousstate_enum" USING "previousState"::"text"::"public"."ContentTransition_previousstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_previousstate_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentTransition_newstate_enum" RENAME TO "ContentTransition_newstate_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_newstate_enum" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "ContentTransition" ALTER COLUMN "newState" TYPE "public"."ContentTransition_newstate_enum" USING "newState"::"text"::"public"."ContentTransition_newstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_newstate_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_newstate_enum_old" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "ContentTransition" ALTER COLUMN "newState" TYPE "public"."ContentTransition_newstate_enum_old" USING "newState"::"text"::"public"."ContentTransition_newstate_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_newstate_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentTransition_newstate_enum_old" RENAME TO "ContentTransition_newstate_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."ContentTransition_previousstate_enum_old" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "ContentTransition" ALTER COLUMN "previousState" TYPE "public"."ContentTransition_previousstate_enum_old" USING "previousState"::"text"::"public"."ContentTransition_previousstate_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ContentTransition_previousstate_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentTransition_previousstate_enum_old" RENAME TO "ContentTransition_previousstate_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."ContentItem_publishingstatus_enum_old" AS ENUM('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" TYPE "public"."ContentItem_publishingstatus_enum_old" USING "publishingStatus"::"text"::"public"."ContentItem_publishingstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ContentItem" ALTER COLUMN "publishingStatus" SET DEFAULT 'DRAFT'`);
        await queryRunner.query(`DROP TYPE "public"."ContentItem_publishingstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ContentItem_publishingstatus_enum_old" RENAME TO "ContentItem_publishingstatus_enum"`);
    }

}
