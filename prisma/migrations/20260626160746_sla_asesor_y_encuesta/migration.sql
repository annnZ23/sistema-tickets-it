/*
  Warnings:

  - You are about to drop the column `creadoAt` on the `encuestas_satisfaccion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "encuestas_satisfaccion" DROP COLUMN "creadoAt",
ADD COLUMN     "enviadaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'Pendiente',
ADD COLUMN     "recordatorioEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "respondidaAt" TIMESTAMP(3),
ALTER COLUMN "calificacion" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "fechaLimiteAsesor" TIMESTAMP(3),
ADD COLUMN     "horasEstimadasAsesor" DOUBLE PRECISION;
