-- CreateTable
CREATE TABLE "calificacion" (
    "id" TEXT NOT NULL,
    "alquilerId" TEXT NOT NULL,
    "evaluadorId" TEXT NOT NULL,
    "evaluadoId" TEXT NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "comentario" VARCHAR(1000),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calificacion_alquilerId_evaluadorId_key" ON "calificacion"("alquilerId", "evaluadorId");

-- CreateIndex
CREATE INDEX "calificacion_evaluadoId_creadoEn_idx" ON "calificacion"("evaluadoId", "creadoEn");

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquiler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_evaluadoId_fkey" FOREIGN KEY ("evaluadoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
