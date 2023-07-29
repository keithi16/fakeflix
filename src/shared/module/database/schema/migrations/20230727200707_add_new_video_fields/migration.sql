/*
  Warnings:

  - You are about to drop the column `name` on the `Video` table. All the data in the column will be lost.
  - Added the required column `UpdateAt` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createAt` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `videoUrl` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "name",
ADD COLUMN     "UpdateAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "videoUrl" TEXT NOT NULL;
