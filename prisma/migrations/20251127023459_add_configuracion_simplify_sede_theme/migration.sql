/*
  Warnings:

  - You are about to drop the column `address` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `favicon` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `legalName` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `nit` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `phoneCountryCode` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `themeId` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `sedes` table. All the data in the column will be lost.
  - You are about to drop the column `isCustom` on the `themes` table. All the data in the column will be lost.
  - You are about to drop the column `sedeId` on the `themes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sedes" DROP CONSTRAINT "sedes_themeId_fkey";

-- DropForeignKey
ALTER TABLE "themes" DROP CONSTRAINT "themes_sedeId_fkey";

-- DropIndex
DROP INDEX "sedes_email_key";

-- DropIndex
DROP INDEX "sedes_nit_key";

-- DropIndex
DROP INDEX "themes_sedeId_idx";

-- AlterTable
ALTER TABLE "sedes" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "email",
DROP COLUMN "favicon",
DROP COLUMN "latitude",
DROP COLUMN "legalName",
DROP COLUMN "logo",
DROP COLUMN "longitude",
DROP COLUMN "nit",
DROP COLUMN "phoneCountryCode",
DROP COLUMN "phoneNumber",
DROP COLUMN "postalCode",
DROP COLUMN "state",
DROP COLUMN "themeId",
DROP COLUMN "website";

-- AlterTable
ALTER TABLE "themes" DROP COLUMN "isCustom",
DROP COLUMN "sedeId";

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "nombreCliente" VARCHAR(200) NOT NULL,
    "pais" VARCHAR(100) NOT NULL DEFAULT 'México',
    "ciudad" VARCHAR(100) NOT NULL,
    "logo" TEXT,
    "slogan" VARCHAR(255),
    "titular" VARCHAR(200),
    "themeId" INTEGER,
    "salarioMinimo" DECIMAL(10,2) NOT NULL,
    "uma" DECIMAL(10,2) NOT NULL,
    "correoContacto" VARCHAR(100),
    "whatsappContacto" VARCHAR(20),
    "telContacto" VARCHAR(20),
    "correoAtencion" VARCHAR(100),
    "whatsappAtencion" VARCHAR(20),
    "telAtencion" VARCHAR(20),
    "tasaRecargo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_subsedeId_key" ON "configuraciones"("subsedeId");

-- CreateIndex
CREATE INDEX "configuraciones_sedeId_idx" ON "configuraciones"("sedeId");

-- CreateIndex
CREATE INDEX "configuraciones_subsedeId_idx" ON "configuraciones"("subsedeId");

-- CreateIndex
CREATE INDEX "configuraciones_themeId_idx" ON "configuraciones"("themeId");

-- CreateIndex
CREATE INDEX "configuraciones_isActive_idx" ON "configuraciones"("isActive");

-- CreateIndex
CREATE INDEX "configuraciones_deletedAt_idx" ON "configuraciones"("deletedAt");

-- AddForeignKey
ALTER TABLE "configuraciones" ADD CONSTRAINT "configuraciones_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones" ADD CONSTRAINT "configuraciones_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuraciones" ADD CONSTRAINT "configuraciones_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
