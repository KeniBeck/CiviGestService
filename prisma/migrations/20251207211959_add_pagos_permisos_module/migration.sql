-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE', 'SPEI', 'OTRO');

-- CreateEnum
CREATE TYPE "estatus_pago" AS ENUM ('PAGADO', 'PENDIENTE', 'CANCELADO', 'REEMBOLSADO');

-- CreateTable
CREATE TABLE "pagos_permisos" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "permisoId" INTEGER NOT NULL,
    "nombreCiudadano" VARCHAR(200) NOT NULL,
    "documentoCiudadano" VARCHAR(50) NOT NULL,
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
    "comprobantePdf" TEXT,
    "qrComprobante" TEXT,
    "pagoOriginalId" INTEGER,
    "esReembolso" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "deletedBy" INTEGER,

    CONSTRAINT "pagos_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagos_permisos_sedeId_idx" ON "pagos_permisos"("sedeId");

-- CreateIndex
CREATE INDEX "pagos_permisos_subsedeId_idx" ON "pagos_permisos"("subsedeId");

-- CreateIndex
CREATE INDEX "pagos_permisos_permisoId_idx" ON "pagos_permisos"("permisoId");

-- CreateIndex
CREATE INDEX "pagos_permisos_usuarioCobroId_idx" ON "pagos_permisos"("usuarioCobroId");

-- CreateIndex
CREATE INDEX "pagos_permisos_autorizadoPor_idx" ON "pagos_permisos"("autorizadoPor");

-- CreateIndex
CREATE INDEX "pagos_permisos_fechaPago_idx" ON "pagos_permisos"("fechaPago");

-- CreateIndex
CREATE INDEX "pagos_permisos_estatus_idx" ON "pagos_permisos"("estatus");

-- CreateIndex
CREATE INDEX "pagos_permisos_esReembolso_idx" ON "pagos_permisos"("esReembolso");

-- CreateIndex
CREATE INDEX "pagos_permisos_pagoOriginalId_idx" ON "pagos_permisos"("pagoOriginalId");

-- CreateIndex
CREATE INDEX "pagos_permisos_isActive_idx" ON "pagos_permisos"("isActive");

-- CreateIndex
CREATE INDEX "pagos_permisos_deletedAt_idx" ON "pagos_permisos"("deletedAt");

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_permisoId_fkey" FOREIGN KEY ("permisoId") REFERENCES "permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_usuarioCobroId_fkey" FOREIGN KEY ("usuarioCobroId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_autorizadoPor_fkey" FOREIGN KEY ("autorizadoPor") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_permisos" ADD CONSTRAINT "pagos_permisos_pagoOriginalId_fkey" FOREIGN KEY ("pagoOriginalId") REFERENCES "pagos_permisos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
