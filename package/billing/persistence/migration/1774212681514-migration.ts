import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774212681514 implements MigrationInterface {
    name = 'Migration1774212681514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Subscription_status_enum" RENAME TO "Subscription_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."Subscription_status_enum" AS ENUM('Active', 'Inactive', 'Trialing', 'PastDue', 'Suspended', 'Cancelled', 'Expired')`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "public"."Subscription_status_enum" USING "status"::"text"::"public"."Subscription_status_enum"`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'Inactive'`);
        await queryRunner.query(`DROP TYPE "public"."Subscription_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."Subscription_status_enum_old" AS ENUM('Active', 'Inactive')`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "public"."Subscription_status_enum_old" USING "status"::"text"::"public"."Subscription_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'Inactive'`);
        await queryRunner.query(`DROP TYPE "public"."Subscription_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."Subscription_status_enum_old" RENAME TO "Subscription_status_enum"`);
    }

}
