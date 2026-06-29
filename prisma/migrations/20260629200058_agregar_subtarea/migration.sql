-- CreateEnum
CREATE TYPE "EstadoSubTarea" AS ENUM ('Pendiente', 'EnProceso', 'Completada');

-- CreateTable
CREATE TABLE "sub_tareas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "asignadorId" INTEGER NOT NULL,
    "receptorId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "archivoTipo" TEXT,
    "fechaLimite" TIMESTAMP(3),
    "estado" "EstadoSubTarea" NOT NULL DEFAULT 'Pendiente',
    "completadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_tareas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sub_tareas" ADD CONSTRAINT "sub_tareas_asignadorId_fkey" FOREIGN KEY ("asignadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_tareas" ADD CONSTRAINT "sub_tareas_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_tareas" ADD CONSTRAINT "sub_tareas_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
