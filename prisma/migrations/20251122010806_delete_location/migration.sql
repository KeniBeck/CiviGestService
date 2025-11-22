/*
  Warnings:

  - You are about to drop the column `address` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `municipalityCode` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `phoneCountryCode` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `subsedes` table. All the data in the column will be lost.
  - You are about to drop the column `population` on the `subsedes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subsedes" DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "municipalityCode",
DROP COLUMN "phoneCountryCode",
DROP COLUMN "phoneNumber",
DROP COLUMN "population";
