import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1708006814874 implements MigrationInterface {
  name = 'Migration1708006814874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "TvShow" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_0ecc486b5a7a0f90f5857634ed9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "Video" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "url" character varying NOT NULL, "sizeInKb" integer NOT NULL, "duration" integer NOT NULL, "movieId" uuid, CONSTRAINT "REL_46efd1060cb7a7c545b06120d1" UNIQUE ("movieId"), CONSTRAINT "PK_2a23c3da7a2fc570b1696191b87" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "episode" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "title" character varying NOT NULL, "description" character varying NOT NULL, "season" integer NOT NULL, "number" integer NOT NULL, "tvShowId" uuid, CONSTRAINT "PK_7258b95d6d2bf7f621845a0e143" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "Thumbnail" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "url" character varying NOT NULL, CONSTRAINT "PK_29cfea45a44edc72c599d42037f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."Content_type_enum" AS ENUM('MOVIE', 'TV_SHOW')`
    );
    await queryRunner.query(
      `CREATE TABLE "Content" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "type" "public"."Content_type_enum" NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_7cb78a77f6c66cb6ea6f4316a5c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "Movie" ("id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "contentId" uuid, CONSTRAINT "REL_c155b5944bdd1e260a4ae79bc8" UNIQUE ("contentId"), CONSTRAINT "PK_56d58b76292b87125c5ec8bdde0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "Video" ADD CONSTRAINT "FK_46efd1060cb7a7c545b06120d14" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" ADD CONSTRAINT "FK_bc417590af57a49dc42ce4ba038" FOREIGN KEY ("tvShowId") REFERENCES "TvShow"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "Movie" ADD CONSTRAINT "FK_c155b5944bdd1e260a4ae79bc82" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "Movie" DROP CONSTRAINT "FK_c155b5944bdd1e260a4ae79bc82"`
    );
    await queryRunner.query(
      `ALTER TABLE "episode" DROP CONSTRAINT "FK_bc417590af57a49dc42ce4ba038"`
    );
    await queryRunner.query(
      `ALTER TABLE "Video" DROP CONSTRAINT "FK_46efd1060cb7a7c545b06120d14"`
    );
    await queryRunner.query(`DROP TABLE "Movie"`);
    await queryRunner.query(`DROP TABLE "Content"`);
    await queryRunner.query(`DROP TYPE "public"."Content_type_enum"`);
    await queryRunner.query(`DROP TABLE "Thumbnail"`);
    await queryRunner.query(`DROP TABLE "episode"`);
    await queryRunner.query(`DROP TABLE "Video"`);
    await queryRunner.query(`DROP TABLE "TvShow"`);
  }
}
