-- CreateEnum
CREATE TYPE "permiso_estatus" AS ENUM ('SOLICITADO', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "tipos_permisos" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "camposPersonalizados" JSONB,
    "costoBase" DECIMAL(10,2),
    "numUMAsBase" DECIMAL(10,2),
    "numSalariosBase" DECIMAL(10,2),
    "vigenciaDefecto" INTEGER NOT NULL DEFAULT 365,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "tipos_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "tipoPermisoId" INTEGER NOT NULL,
    "folio" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "nombreCiudadano" VARCHAR(200) NOT NULL,
    "documentoCiudadano" VARCHAR(50) NOT NULL,
    "domicilioCiudadano" VARCHAR(255),
    "telefonoCiudadano" VARCHAR(20),
    "emailCiudadano" VARCHAR(100),
    "costo" DECIMAL(10,2),
    "numSalarios" DECIMAL(10,2),
    "numUMAs" DECIMAL(10,2),
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "vigenciaDias" INTEGER NOT NULL,
    "qr" TEXT,
    "estatus" "permiso_estatus" NOT NULL DEFAULT 'SOLICITADO',
    "documentosAdjuntos" JSONB,
    "camposAdicionales" JSONB,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaRechazo" TIMESTAMP(3),
    "observaciones" TEXT,
    "motivoRechazo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tipos_permisos_sedeId_idx" ON "tipos_permisos"("sedeId");

-- CreateIndex
CREATE INDEX "tipos_permisos_subsedeId_idx" ON "tipos_permisos"("subsedeId");

-- CreateIndex
CREATE INDEX "tipos_permisos_isActive_idx" ON "tipos_permisos"("isActive");

-- CreateIndex
CREATE INDEX "tipos_permisos_deletedAt_idx" ON "tipos_permisos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_permisos_subsedeId_nombre_key" ON "tipos_permisos"("subsedeId", "nombre");

-- CreateIndex
CREATE INDEX "permisos_sedeId_idx" ON "permisos"("sedeId");

-- CreateIndex
CREATE INDEX "permisos_subsedeId_idx" ON "permisos"("subsedeId");

-- CreateIndex
CREATE INDEX "permisos_tipoPermisoId_idx" ON "permisos"("tipoPermisoId");

-- CreateIndex
CREATE INDEX "permisos_documentoCiudadano_idx" ON "permisos"("documentoCiudadano");

-- CreateIndex
CREATE INDEX "permisos_estatus_idx" ON "permisos"("estatus");

-- CreateIndex
CREATE INDEX "permisos_fechaVencimiento_idx" ON "permisos"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "permisos_isActive_idx" ON "permisos"("isActive");

-- CreateIndex
CREATE INDEX "permisos_deletedAt_idx" ON "permisos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_subsedeId_folio_key" ON "permisos"("subsedeId", "folio");

-- AddForeignKey
ALTER TABLE "tipos_permisos" ADD CONSTRAINT "tipos_permisos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_permisos" ADD CONSTRAINT "tipos_permisos_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos" ADD CONSTRAINT "permisos_tipoPermisoId_fkey" FOREIGN KEY ("tipoPermisoId") REFERENCES "tipos_permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
