-- HU-06: desglose de comisión y trazabilidad del pago
ALTER TABLE "pago" ADD COLUMN     "claveIdempotencia" TEXT,
ADD COLUMN     "comision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorMensaje" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'COP',
ADD COLUMN     "montoPropietario" INTEGER NOT NULL DEFAULT 0;

-- HU-10: seguimiento de dispersiones (payouts) y saldo retenido
ALTER TYPE "EstadoTransaccion" ADD VALUE 'PROCESANDO';

ALTER TABLE "billetera" ADD COLUMN     "totalRetirado" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "retiro" ADD COLUMN     "completadoEn" TIMESTAMP(3),
ADD COLUMN     "errorMensaje" TEXT,
ADD COLUMN     "idPayout" TEXT,
ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'COP';

-- Índices de consulta e idempotencia
CREATE UNIQUE INDEX "pago_claveIdempotencia_key" ON "pago"("claveIdempotencia");
CREATE INDEX "pago_estado_idx" ON "pago"("estado");

CREATE UNIQUE INDEX "retiro_idPayout_key" ON "retiro"("idPayout");
DROP INDEX "retiro_billeteraId_idx";
CREATE INDEX "retiro_billeteraId_creadoEn_idx" ON "retiro"("billeteraId", "creadoEn");
CREATE INDEX "retiro_estado_idx" ON "retiro"("estado");
