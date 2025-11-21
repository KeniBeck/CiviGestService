/*
  Warnings:

  - The values [CC,CE,TI,NIT] on the enum `document_type` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `tenantId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "role_level" AS ENUM ('SUPER_ADMIN', 'ESTATAL', 'MUNICIPAL', 'OPERATIVO');

-- CreateEnum
CREATE TYPE "access_level" AS ENUM ('TENANT', 'SEDE', 'SUBSEDE');

-- AlterEnum
BEGIN;
CREATE TYPE "document_type_new" AS ENUM ('CURP', 'RFC', 'INE', 'PASSPORT', 'VISA');
ALTER TABLE "public"."users" ALTER COLUMN "documentType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "documentType" TYPE "document_type_new" USING ("documentType"::text::"document_type_new");
ALTER TYPE "document_type" RENAME TO "document_type_old";
ALTER TYPE "document_type_new" RENAME TO "document_type";
DROP TYPE "public"."document_type_old";
ALTER TABLE "users" ALTER COLUMN "documentType" SET DEFAULT 'CURP';
COMMIT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "level" "role_level" NOT NULL DEFAULT 'MUNICIPAL';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accessLevel" "access_level" NOT NULL DEFAULT 'SUBSEDE',
ADD COLUMN     "sedeId" INTEGER,
ADD COLUMN     "subsedeId" INTEGER,
ADD COLUMN     "tenantId" INTEGER NOT NULL,
ALTER COLUMN "phoneCountryCode" SET DEFAULT '+52',
ALTER COLUMN "documentType" SET DEFAULT 'CURP';

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "nit" VARCHAR(20),
    "legalName" VARCHAR(200),
    "email" TEXT NOT NULL,
    "phoneCountryCode" VARCHAR(5) NOT NULL DEFAULT '+52',
    "phoneNumber" VARCHAR(20) NOT NULL,
    "address" VARCHAR(255),
    "website" VARCHAR(255),
    "logo" TEXT,
    "favicon" TEXT,
    "themeId" INTEGER,
    "databaseUrl" TEXT,
    "databaseName" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sedes" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "email" TEXT,
    "phoneCountryCode" VARCHAR(5) NOT NULL DEFAULT '+52',
    "phoneNumber" VARCHAR(20),
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(10),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsedes" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "email" TEXT,
    "phoneCountryCode" VARCHAR(5) NOT NULL DEFAULT '+52',
    "phoneNumber" VARCHAR(20),
    "address" VARCHAR(255) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "population" INTEGER,
    "municipalityCode" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "subsedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sede_access" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_sede_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subsede_access" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_subsede_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "primaryColor" VARCHAR(7) NOT NULL,
    "secondaryColor" VARCHAR(7) NOT NULL,
    "accentColor" VARCHAR(7) NOT NULL,
    "backgroundColor" VARCHAR(7) NOT NULL,
    "surfaceColor" VARCHAR(7) NOT NULL,
    "textPrimaryColor" VARCHAR(7) NOT NULL,
    "textSecondaryColor" VARCHAR(7) NOT NULL,
    "successColor" VARCHAR(7) NOT NULL,
    "warningColor" VARCHAR(7) NOT NULL,
    "errorColor" VARCHAR(7) NOT NULL,
    "infoColor" VARCHAR(7) NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_nit_key" ON "tenants"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_databaseName_key" ON "tenants"("databaseName");

-- CreateIndex
CREATE INDEX "tenants_code_idx" ON "tenants"("code");

-- CreateIndex
CREATE INDEX "tenants_isActive_idx" ON "tenants"("isActive");

-- CreateIndex
CREATE INDEX "tenants_deletedAt_idx" ON "tenants"("deletedAt");

-- CreateIndex
CREATE INDEX "sedes_tenantId_idx" ON "sedes"("tenantId");

-- CreateIndex
CREATE INDEX "sedes_isActive_idx" ON "sedes"("isActive");

-- CreateIndex
CREATE INDEX "sedes_deletedAt_idx" ON "sedes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sedes_tenantId_code_key" ON "sedes"("tenantId", "code");

-- CreateIndex
CREATE INDEX "subsedes_sedeId_idx" ON "subsedes"("sedeId");

-- CreateIndex
CREATE INDEX "subsedes_isActive_idx" ON "subsedes"("isActive");

-- CreateIndex
CREATE INDEX "subsedes_deletedAt_idx" ON "subsedes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subsedes_sedeId_code_key" ON "subsedes"("sedeId", "code");

-- CreateIndex
CREATE INDEX "user_sede_access_userId_idx" ON "user_sede_access"("userId");

-- CreateIndex
CREATE INDEX "user_sede_access_sedeId_idx" ON "user_sede_access"("sedeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sede_access_userId_sedeId_key" ON "user_sede_access"("userId", "sedeId");

-- CreateIndex
CREATE INDEX "user_subsede_access_userId_idx" ON "user_subsede_access"("userId");

-- CreateIndex
CREATE INDEX "user_subsede_access_subsedeId_idx" ON "user_subsede_access"("subsedeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_subsede_access_userId_subsedeId_key" ON "user_subsede_access"("userId", "subsedeId");

-- CreateIndex
CREATE INDEX "themes_isDefault_idx" ON "themes"("isDefault");

-- CreateIndex
CREATE INDEX "themes_tenantId_idx" ON "themes"("tenantId");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_sedeId_idx" ON "users"("sedeId");

-- CreateIndex
CREATE INDEX "users_subsedeId_idx" ON "users"("subsedeId");

-- CreateIndex
CREATE INDEX "users_accessLevel_idx" ON "users"("accessLevel");

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sedes" ADD CONSTRAINT "sedes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subsedes" ADD CONSTRAINT "subsedes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sede_access" ADD CONSTRAINT "user_sede_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sede_access" ADD CONSTRAINT "user_sede_access_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subsede_access" ADD CONSTRAINT "user_subsede_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subsede_access" ADD CONSTRAINT "user_subsede_access_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
