-- Unificación de artículos: identificador del artículo guardado en el
-- navegador del usuario, para importar una sola vez los datos de localStorage.
ALTER TABLE "articulo" ADD COLUMN "claveExterna" TEXT;

CREATE UNIQUE INDEX "articulo_propietarioId_claveExterna_key"
  ON "articulo"("propietarioId", "claveExterna");
