/*
  Warnings:

  - The values [TENANT] on the enum `access_level` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tenantId` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `themes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `tenants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `sedes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nit]` on the table `sedes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `sedes` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `sedes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `sedes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sedeId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "access_level_new" AS ENUM ('SEDE', 'SUBSEDE');
ALTER TABLE "public"."users" ALTER COLUMN "accessLevel" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "accessLevel" TYPE "access_level_new" USING ("accessLevel"::text::"access_level_new");
ALTER TYPE "access_level" RENAME TO "access_level_old";
ALTER TYPE "access_level_new" RENAME TO "access_level";
DROP TYPE "public"."access_level_old";
ALTER TABLE "users" ALTER COLUMN "accessLevel" SET DEFAULT 'SUBSEDE';
COMMIT;

-- DropForeignKey
ALTER TABLE "sedes" DROP CONSTRAINT "sedes_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_themeId_fkey";

-- DropForeignKey
ALTER TABLE "themes" DROP CONSTRAINT "themes_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_sedeId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";

-- DropIndex
DROP INDEX "sedes_tenantId_code_key";

-- DropIndex
DROP INDEX "sedes_tenantId_idx";

-- DropIndex
DROP INDEX "themes_tenantId_idx";

-- DropIndex
DROP INDEX "users_tenantId_idx";

-- AlterTable
ALTER TABLE "sedes" DROP COLUMN "tenantId",
ADD COLUMN     "favicon" TEXT,
ADD COLUMN     "legalName" VARCHAR(200),
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "nit" VARCHAR(20),
ADD COLUMN     "themeId" INTEGER,
ADD COLUMN     "website" VARCHAR(255),
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phoneNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "themes" DROP COLUMN "tenantId",
ADD COLUMN     "sedeId" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "tenantId",
ALTER COLUMN "sedeId" SET NOT NULL;

-- DropTable
DROP TABLE "tenants";

-- CreateIndex
CREATE UNIQUE INDEX "sedes_code_key" ON "sedes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sedes_nit_key" ON "sedes"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "sedes_email_key" ON "sedes"("email");

-- CreateIndex
CREATE INDEX "sedes_code_idx" ON "sedes"("code");

-- CreateIndex
CREATE INDEX "themes_sedeId_idx" ON "themes"("sedeId");

-- AddForeignKey
ALTER TABLE "sedes" ADD CONSTRAINT "sedes_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
