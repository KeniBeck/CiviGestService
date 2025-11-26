/*
  Warnings:

  - A unique constraint covering the columns `[subsedeId,tipo]` on the table `tipos_agentes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sedeId` to the `tipos_agentes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subsedeId` to the `tipos_agentes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tipos_agentes_tipo_key";

-- AlterTable
ALTER TABLE "tipos_agentes" ADD COLUMN     "sedeId" INTEGER NOT NULL,
ADD COLUMN     "subsedeId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "tipos_agentes_sedeId_idx" ON "tipos_agentes"("sedeId");

-- CreateIndex
CREATE INDEX "tipos_agentes_subsedeId_idx" ON "tipos_agentes"("subsedeId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_agentes_subsedeId_tipo_key" ON "tipos_agentes"("subsedeId", "tipo");

-- AddForeignKey
ALTER TABLE "tipos_agentes" ADD CONSTRAINT "tipos_agentes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_agentes" ADD CONSTRAINT "tipos_agentes_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
