/*
  Warnings:

  - A unique constraint covering the columns `[name,sedeId,subsedeId]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "roles_name_key";

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sedeId" INTEGER,
ADD COLUMN     "subsedeId" INTEGER;

-- CreateIndex
CREATE INDEX "roles_sedeId_idx" ON "roles"("sedeId");

-- CreateIndex
CREATE INDEX "roles_subsedeId_idx" ON "roles"("subsedeId");

-- CreateIndex
CREATE INDEX "roles_isGlobal_idx" ON "roles"("isGlobal");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_sedeId_subsedeId_key" ON "roles"("name", "sedeId", "subsedeId");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_subsedeId_fkey" FOREIGN KEY ("subsedeId") REFERENCES "subsedes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
