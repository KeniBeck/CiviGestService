-- Rename column
ALTER TABLE "agentes"
RENAME COLUMN "numPlantilla" TO "numPlaca";

-- Rename index (opcional pero recomendado)
ALTER INDEX "agentes_subsedeId_numPlantilla_key"
RENAME TO "agentes_subsedeId_numPlaca_key";
