/*
  Warnings:

  - A unique constraint covering the columns `[correo]` on the table `agentes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `agentes` will be added. If there are existing duplicate values, this will fail.
  - Made the column `correo` on table `agentes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contrasena` on table `agentes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "agentes" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" VARCHAR(255),
ALTER COLUMN "correo" SET NOT NULL,
ALTER COLUMN "contrasena" SET NOT NULL;

-- CreateTable
CREATE TABLE "agente_roles" (
    "id" SERIAL NOT NULL,
    "agenteId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "agente_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agente_roles_agenteId_idx" ON "agente_roles"("agenteId");

-- CreateIndex
CREATE INDEX "agente_roles_roleId_idx" ON "agente_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "agente_roles_agenteId_roleId_key" ON "agente_roles"("agenteId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_correo_key" ON "agentes"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_passwordResetToken_key" ON "agentes"("passwordResetToken");

-- CreateIndex
CREATE INDEX "agentes_correo_idx" ON "agentes"("correo");

-- AddForeignKey
ALTER TABLE "agente_roles" ADD CONSTRAINT "agente_roles_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "agentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agente_roles" ADD CONSTRAINT "agente_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
