/*
  Warnings:

  - You are about to drop the column `comprobantePdf` on the `pagos_permisos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenPublico]` on the table `pagos_permisos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pagos_permisos" DROP COLUMN "comprobantePdf",
ADD COLUMN     "tokenExpiraEn" TIMESTAMP(3),
ADD COLUMN     "tokenPublico" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "pagos_permisos_tokenPublico_key" ON "pagos_permisos"("tokenPublico");

-- CreateIndex
CREATE INDEX "pagos_permisos_tokenPublico_idx" ON "pagos_permisos"("tokenPublico");

-- CreateIndex
CREATE INDEX "pagos_permisos_tokenExpiraEn_idx" ON "pagos_permisos"("tokenExpiraEn");
