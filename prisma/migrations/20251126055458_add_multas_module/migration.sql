-- CreateTable
CREATE TABLE "multas" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "costo" DECIMAL(10,2),
    "numUMAs" DECIMAL(10,2),
    "numSalarios" DECIMAL(10,2),
    "recargo" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "multas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "multas_sedeId_idx" ON "multas"("sedeId");

-- CreateIndex
CREATE INDEX "multas_subsedeId_idx" ON "multas"("subsedeId");

-- CreateIndex
CREATE INDEX "multas_isActive_idx" ON "multas"("isActive");

-- CreateIndex
CREATE INDEX "multas_deletedAt_idx" ON "multas"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "multas_subsedeId_codigo_key" ON "multas"("subsedeId", "codigo");

-- AddForeignKey
ALTER TABLE "multas" ADD CONSTRAINT "multas_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multas" ADD CONSTRAINT "multas_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
