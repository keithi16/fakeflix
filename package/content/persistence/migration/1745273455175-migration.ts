import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745273455175 implements MigrationInterface {
    name = 'Migration1745273455175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP CONSTRAINT "UQ_678d67fbd94f3a4f4c57a0507b0"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" DROP COLUMN "videoId"`);
        await queryRunner.query(`ALTER TABLE "Video" ADD "metadataId" uuid`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "UQ_ed9fa1e05957c5feece62f0b036" UNIQUE ("metadataId")`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ALTER COLUMN "transcript" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Video" ADD CONSTRAINT "FK_ed9fa1e05957c5feece62f0b036" FOREIGN KEY ("metadataId") REFERENCES "VideoMetadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "FK_ed9fa1e05957c5feece62f0b036"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ALTER COLUMN "transcript" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Video" DROP CONSTRAINT "UQ_ed9fa1e05957c5feece62f0b036"`);
        await queryRunner.query(`ALTER TABLE "Video" DROP COLUMN "metadataId"`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD "videoId" uuid`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD CONSTRAINT "UQ_678d67fbd94f3a4f4c57a0507b0" UNIQUE ("videoId")`);
        await queryRunner.query(`ALTER TABLE "VideoMetadata" ADD CONSTRAINT "FK_678d67fbd94f3a4f4c57a0507b0" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
