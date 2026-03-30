import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774888825953 implements MigrationInterface {
    name = 'Migration1774888825953'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recommendations_pre_computed" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" character varying NOT NULL, "contentId" character varying NOT NULL, "score" numeric(10,4) NOT NULL, "rank" integer NOT NULL, "matchedGenres" jsonb NOT NULL DEFAULT '[]', "computedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_09621320627fee5904a2473c99a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4bad21d4ac912d32caf35d073b" ON "recommendations_pre_computed" ("userId", "contentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7ec7ee4d937f4b0e81d520d17" ON "recommendations_pre_computed" ("userId") `);
        await queryRunner.query(`CREATE TABLE "recommendations_continue_watching_dismiss" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" character varying NOT NULL, "contentId" character varying NOT NULL, "dismissedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_d2b40d387b208d8d64d07928d5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ef6442be913de87188b9ffe16a" ON "recommendations_continue_watching_dismiss" ("userId", "contentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4cca1d1d5809fd40e33f0291ac" ON "recommendations_continue_watching_dismiss" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4cca1d1d5809fd40e33f0291ac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef6442be913de87188b9ffe16a"`);
        await queryRunner.query(`DROP TABLE "recommendations_continue_watching_dismiss"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7ec7ee4d937f4b0e81d520d17"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4bad21d4ac912d32caf35d073b"`);
        await queryRunner.query(`DROP TABLE "recommendations_pre_computed"`);
    }

}
