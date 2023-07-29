/*
  Warnings:

  - You are about to drop the column `UpdateAt` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `createAt` on the `Video` table. All the data in the column will be lost.
  - Added the required column `UpdatedAt` to the `Video` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAt` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "UpdateAt",
DROP COLUMN "createAt",
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL;
