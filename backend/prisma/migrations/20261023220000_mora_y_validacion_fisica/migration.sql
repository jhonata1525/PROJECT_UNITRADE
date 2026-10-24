ALTER TYPE "TipoTransaccion" ADD VALUE 'PENALIZACION';

ALTER TABLE "usuario"
ADD COLUMN "suspendidoPorMora" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "alquiler"
ADD COLUMN "codigoEntrega" TEXT,
ADD COLUMN "codigoQrEntrega" TEXT,
ADD COLUMN "entregaConfirmadaEn" TIMESTAMP(3),
ADD COLUMN "devolucionConfirmadaEn" TIMESTAMP(3),
ADD COLUMN "moraMonto" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "moraPagada" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "moraPagoEstado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN "moraTransaccionId" TEXT;

CREATE UNIQUE INDEX "alquiler_codigoQrEntrega_key"
ON "alquiler"("codigoQrEntrega");

CREATE UNIQUE INDEX "alquiler_moraTransaccionId_key"
ON "alquiler"("moraTransaccionId");

CREATE INDEX "alquiler_estado_fin_idx"
ON "alquiler"("estado", "fin");
