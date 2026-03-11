-- CreateTable
CREATE TABLE "pagos_infracciones" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "multaId" INTEGER NOT NULL,
    "nombreCiudadano" VARCHAR(200) NOT NULL,
    "documentoCiudadano" VARCHAR(50) NOT NULL,
    "folioInfraccion" VARCHAR(100) NOT NULL,
    "costoBase" DECIMAL(10,2) NOT NULL,
    "descuentoPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "descuentoMonto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "metodoPago" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "referenciaPago" VARCHAR(100),
    "autorizaDescuento" BOOLEAN NOT NULL DEFAULT false,
    "autorizadoPor" INTEGER,
    "firmaAutorizacion" TEXT,
    "usuarioCobroId" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estatus" "estatus_pago" NOT NULL DEFAULT 'PAGADO',
    "observaciones" TEXT,
    "qrComprobante" TEXT,
    "tokenPublico" VARCHAR(255),
    "tokenExpiraEn" TIMESTAMP(3),
    "pagoOriginalId" INTEGER,
    "esReembolso" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "pagos_infracciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagos_infracciones_tokenPublico_key" ON "pagos_infracciones"("tokenPublico");

-- CreateIndex
CREATE INDEX "pagos_infracciones_sedeId_idx" ON "pagos_infracciones"("sedeId");

-- CreateIndex
CREATE INDEX "pagos_infracciones_subsedeId_idx" ON "pagos_infracciones"("subsedeId");

-- CreateIndex
CREATE INDEX "pagos_infracciones_multaId_idx" ON "pagos_infracciones"("multaId");

-- CreateIndex
CREATE INDEX "pagos_infracciones_usuarioCobroId_idx" ON "pagos_infracciones"("usuarioCobroId");

-- CreateIndex
CREATE INDEX "pagos_infracciones_autorizadoPor_idx" ON "pagos_infracciones"("autorizadoPor");

-- CreateIndex
CREATE INDEX "pagos_infracciones_fechaPago_idx" ON "pagos_infracciones"("fechaPago");

-- CreateIndex
CREATE INDEX "pagos_infracciones_estatus_idx" ON "pagos_infracciones"("estatus");

-- CreateIndex
CREATE INDEX "pagos_infracciones_esReembolso_idx" ON "pagos_infracciones"("esReembolso");

-- CreateIndex
CREATE INDEX "pagos_infracciones_pagoOriginalId_idx" ON "pagos_infracciones"("pagoOriginalId");

-- CreateIndex
CREATE INDEX "pagos_infracciones_tokenPublico_idx" ON "pagos_infracciones"("tokenPublico");

-- CreateIndex
CREATE INDEX "pagos_infracciones_tokenExpiraEn_idx" ON "pagos_infracciones"("tokenExpiraEn");

-- CreateIndex
CREATE INDEX "pagos_infracciones_folioInfraccion_idx" ON "pagos_infracciones"("folioInfraccion");

-- CreateIndex
CREATE INDEX "pagos_infracciones_documentoCiudadano_idx" ON "pagos_infracciones"("documentoCiudadano");

-- CreateIndex
CREATE INDEX "pagos_infracciones_isActive_idx" ON "pagos_infracciones"("isActive");

-- CreateIndex
CREATE INDEX "pagos_infracciones_deletedAt_idx" ON "pagos_infracciones"("deletedAt");

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_multaId_fkey" FOREIGN KEY ("multaId") REFERENCES "multas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_usuarioCobroId_fkey" FOREIGN KEY ("usuarioCobroId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_autorizadoPor_fkey" FOREIGN KEY ("autorizadoPor") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_infracciones" ADD CONSTRAINT "pagos_infracciones_pagoOriginalId_fkey" FOREIGN KEY ("pagoOriginalId") REFERENCES "pagos_infracciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
