/*
  Warnings:

  - You are about to drop the column `agenteId` on the `patrullas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "patrullas" DROP CONSTRAINT "patrullas_agenteId_fkey";

-- DropIndex
DROP INDEX "patrullas_agenteId_idx";

-- AlterTable
ALTER TABLE "agentes" ADD COLUMN     "patrullaId" INTEGER;

-- AlterTable
ALTER TABLE "patrullas" DROP COLUMN "agenteId";

-- CreateIndex
CREATE INDEX "agentes_patrullaId_idx" ON "agentes"("patrullaId");

-- AddForeignKey
ALTER TABLE "agentes" ADD CONSTRAINT "agentes_patrullaId_fkey" FOREIGN KEY ("patrullaId") REFERENCES "patrullas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
