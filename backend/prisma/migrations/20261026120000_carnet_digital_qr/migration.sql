-- Carnet digital: token público de verificación y código estudiantil.
ALTER TABLE "usuario"
  ADD COLUMN "tokenCarnet" TEXT,
  ADD COLUMN "codigoEstudiantil" TEXT,
  ADD COLUMN "carnetVigenteHasta" TIMESTAMP(3);

CREATE UNIQUE INDEX "usuario_tokenCarnet_key" ON "usuario"("tokenCarnet");
CREATE UNIQUE INDEX "usuario_codigoEstudiantil_key" ON "usuario"("codigoEstudiantil");
