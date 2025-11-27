/*
  Warnings:

  - You are about to drop the column `departamento` on the `multas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "multas" DROP COLUMN "departamento",
ADD COLUMN     "departamentoId" INTEGER;

-- CreateTable
CREATE TABLE "departamentos" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departamentos_sedeId_idx" ON "departamentos"("sedeId");

-- CreateIndex
CREATE INDEX "departamentos_subsedeId_idx" ON "departamentos"("subsedeId");

-- CreateIndex
CREATE INDEX "departamentos_isActive_idx" ON "departamentos"("isActive");

-- CreateIndex
CREATE INDEX "departamentos_deletedAt_idx" ON "departamentos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_subsedeId_nombre_key" ON "departamentos"("subsedeId", "nombre");

-- AddForeignKey
ALTER TABLE "multas" ADD CONSTRAINT "multas_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
