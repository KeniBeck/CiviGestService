-- CreateTable
CREATE TABLE "tipos_agentes" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "tipos_agentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentes" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "nombres" VARCHAR(100) NOT NULL,
    "apellidoPaterno" VARCHAR(100) NOT NULL,
    "apellidoMaterno" VARCHAR(100) NOT NULL,
    "tipoId" INTEGER NOT NULL,
    "cargo" VARCHAR(100) NOT NULL,
    "numPlantilla" VARCHAR(50) NOT NULL,
    "numEmpleadoBiometrico" VARCHAR(50),
    "foto" TEXT,
    "whatsapp" VARCHAR(20),
    "correo" VARCHAR(100),
    "contrasena" VARCHAR(255),
    "departamentoId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "agentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrullas" (
    "id" SERIAL NOT NULL,
    "sedeId" INTEGER NOT NULL,
    "subsedeId" INTEGER NOT NULL,
    "agenteId" INTEGER NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "placa" VARCHAR(20) NOT NULL,
    "numPatrulla" VARCHAR(50) NOT NULL,
    "serie" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "patrullas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_agentes_tipo_key" ON "tipos_agentes"("tipo");

-- CreateIndex
CREATE INDEX "tipos_agentes_isActive_idx" ON "tipos_agentes"("isActive");

-- CreateIndex
CREATE INDEX "tipos_agentes_deletedAt_idx" ON "tipos_agentes"("deletedAt");

-- CreateIndex
CREATE INDEX "agentes_sedeId_idx" ON "agentes"("sedeId");

-- CreateIndex
CREATE INDEX "agentes_subsedeId_idx" ON "agentes"("subsedeId");

-- CreateIndex
CREATE INDEX "agentes_tipoId_idx" ON "agentes"("tipoId");

-- CreateIndex
CREATE INDEX "agentes_departamentoId_idx" ON "agentes"("departamentoId");

-- CreateIndex
CREATE INDEX "agentes_isActive_idx" ON "agentes"("isActive");

-- CreateIndex
CREATE INDEX "agentes_deletedAt_idx" ON "agentes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_subsedeId_numPlantilla_key" ON "agentes"("subsedeId", "numPlantilla");

-- CreateIndex
CREATE INDEX "patrullas_sedeId_idx" ON "patrullas"("sedeId");

-- CreateIndex
CREATE INDEX "patrullas_subsedeId_idx" ON "patrullas"("subsedeId");

-- CreateIndex
CREATE INDEX "patrullas_agenteId_idx" ON "patrullas"("agenteId");

-- CreateIndex
CREATE INDEX "patrullas_isActive_idx" ON "patrullas"("isActive");

-- CreateIndex
CREATE INDEX "patrullas_deletedAt_idx" ON "patrullas"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "patrullas_subsedeId_numPatrulla_key" ON "patrullas"("subsedeId", "numPatrulla");

-- CreateIndex
CREATE UNIQUE INDEX "patrullas_placa_key" ON "patrullas"("placa");

-- AddForeignKey
ALTER TABLE "agentes" ADD CONSTRAINT "agentes_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes" ADD CONSTRAINT "agentes_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes" ADD CONSTRAINT "agentes_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipos_agentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes" ADD CONSTRAINT "agentes_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrullas" ADD CONSTRAINT "patrullas_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrullas" ADD CONSTRAINT "patrullas_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrullas" ADD CONSTRAINT "patrullas_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "agentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
