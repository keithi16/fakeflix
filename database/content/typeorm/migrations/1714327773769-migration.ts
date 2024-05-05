import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1714327773769 implements MigrationInterface {
  name = 'Migration1714327773769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Movie" ADD "externalRating" double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Movie" DROP COLUMN "externalRating"`);
  }
}
