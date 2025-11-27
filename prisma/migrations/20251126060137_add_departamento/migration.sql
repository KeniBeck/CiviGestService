/*
  Warnings:

  - Added the required column `departamento` to the `multas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "multas" ADD COLUMN     "departamento" VARCHAR(100) NOT NULL;
