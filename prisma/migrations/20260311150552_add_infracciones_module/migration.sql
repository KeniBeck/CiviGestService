-- CreateEnum
CREATE TYPE "infraccion_estatus" AS ENUM ('LEVANTADA', 'PAGADA', 'CANCELADA', 'PRESCRITA', 'EN_PROCESO');

-- AlterTable
ALTER TABLE "pagos_infracciones" ADD COLUMN     "infraccionId" INTEGER;

-- CreateTable
CREATE TABLE "infracciones" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "multaId" INTEGER NOT NULL,
    "folio" VARCHAR(100) NOT NULL,
    "nombreCiudadano" VARCHAR(200) NOT NULL,
    "documentoCiudadano" VARCHAR(50) NOT NULL,
    "domicilioCiudadano" VARCHAR(255),
    "telefonoCiudadano" VARCHAR(20),
    "emailCiudadano" VARCHAR(100),
    "descripcion" TEXT,
    "ubicacion" VARCHAR(255),
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "fechaInfraccion" TIMESTAMP(3) NOT NULL,
    "fechaLevantamiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agenteId" INTEGER,
    "costoBase" DECIMAL(10,2),
    "numUMAs" DECIMAL(10,2),
    "numSalarios" DECIMAL(10,2),
    "estatus" "infraccion_estatus" NOT NULL DEFAULT 'LEVANTADA',
    "evidencias" JSONB,
    "observaciones" TEXT,
    "fechaLimitePago" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "infracciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "infracciones_folio_key" ON "infracciones"("folio");

-- CreateIndex
CREATE INDEX "infracciones_sedeId_idx" ON "infracciones"("sedeId");

-- CreateIndex
CREATE INDEX "infracciones_subsedeId_idx" ON "infracciones"("subsedeId");

-- CreateIndex
CREATE INDEX "infracciones_multaId_idx" ON "infracciones"("multaId");

-- CreateIndex
CREATE INDEX "infracciones_agenteId_idx" ON "infracciones"("agenteId");

-- CreateIndex
CREATE INDEX "infracciones_folio_idx" ON "infracciones"("folio");

-- CreateIndex
CREATE INDEX "infracciones_documentoCiudadano_idx" ON "infracciones"("documentoCiudadano");

-- CreateIndex
CREATE INDEX "infracciones_estatus_idx" ON "infracciones"("estatus");

-- CreateIndex
CREATE INDEX "infracciones_fechaInfraccion_idx" ON "infracciones"("fechaInfraccion");

-- CreateIndex
CREATE INDEX "infracciones_fechaLimitePago_idx" ON "infracciones"("fechaLimitePago");

-- CreateIndex
CREATE INDEX "infracciones_isActive_idx" ON "infracciones"("isActive");

-- CreateIndex
CREATE INDEX "infracciones_deletedAt_idx" ON "infracciones"("deletedAt");

-- CreateIndex
CREATE INDEX "pagos_infracciones_infraccionId_idx" ON "pagos_infracciones"("infraccionId");

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_multaId_fkey" FOREIGN KEY ("multaId") REFERENCES "multas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infracciones" ADD CONSTRAINT "infracciones_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "agentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_infraccionId_fkey" FOREIGN KEY ("infraccionId") REFERENCES "infracciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
