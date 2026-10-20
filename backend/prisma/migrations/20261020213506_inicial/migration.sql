-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "CondicionArticulo" AS ENUM ('NUEVO', 'COMO_NUEVO', 'BUENO', 'REGULAR');

-- CreateEnum
CREATE TYPE "EstadoAlquiler" AS ENUM ('PENDIENTE_ENTREGA', 'ACTIVO', 'PENDIENTE_DEVOLUCION', 'COMPLETADO', 'CANCELADO', 'EN_MORA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('INGRESO', 'RETIRO', 'COMISION', 'REEMBOLSO', 'DEPOSITO');

-- CreateEnum
CREATE TYPE "EstadoTransaccion" AS ENUM ('PENDIENTE', 'COMPLETADO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "MetodoRetiro" AS ENUM ('NEQUI', 'DAVIPLATA', 'BANCO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hashContrasena" TEXT NOT NULL,
    "telefono" TEXT,
    "telefonoVerificado" BOOLEAN NOT NULL DEFAULT false,
    "fechaVerificacionTelefono" TIMESTAMP(3),
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "sede" TEXT,
    "puntoEntrega" TEXT,
    "fotoPerfil" TEXT,
    "disponibilidad" JSONB,
    "calificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalResenas" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "condicion" "CondicionArticulo" NOT NULL,
    "tarifaHora" INTEGER NOT NULL,
    "tarifaSugerida" INTEGER,
    "ubicacion" TEXT NOT NULL,
    "imagenes" TEXT[],
    "disponibleDesde" TIMESTAMP(3) NOT NULL,
    "disponibleHasta" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "propietarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquiler" (
    "id" TEXT NOT NULL,
    "articuloId" TEXT NOT NULL,
    "arrendatarioId" TEXT NOT NULL,
    "propietarioId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "horas" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "comision" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "estado" "EstadoAlquiler" NOT NULL DEFAULT 'PENDIENTE_ENTREGA',
    "codigoVerificacion" TEXT,
    "codigoQr" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alquiler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL,
    "alquilerId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "metodo" TEXT NOT NULL DEFAULT 'sandbox',
    "idTransaccion" TEXT,
    "pagadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billetera" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "saldoDisponible" INTEGER NOT NULL DEFAULT 0,
    "saldoPendiente" INTEGER NOT NULL DEFAULT 0,
    "totalGanado" INTEGER NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billetera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaccion_billetera" (
    "id" TEXT NOT NULL,
    "billeteraId" TEXT NOT NULL,
    "tipo" "TipoTransaccion" NOT NULL,
    "monto" INTEGER NOT NULL,
    "saldoDespues" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoTransaccion" NOT NULL DEFAULT 'COMPLETADO',
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaccion_billetera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retiro" (
    "id" TEXT NOT NULL,
    "billeteraId" TEXT NOT NULL,
    "metodo" "MetodoRetiro" NOT NULL,
    "cuenta" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoTransaccion" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigo_otp" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "telefono" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_refresco" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "hashToken" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_refresco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE INDEX "usuario_telefono_idx" ON "usuario"("telefono");

-- CreateIndex
CREATE INDEX "articulo_propietarioId_idx" ON "articulo"("propietarioId");

-- CreateIndex
CREATE INDEX "articulo_categoria_idx" ON "articulo"("categoria");

-- CreateIndex
CREATE INDEX "articulo_activo_idx" ON "articulo"("activo");

-- CreateIndex
CREATE INDEX "alquiler_arrendatarioId_idx" ON "alquiler"("arrendatarioId");

-- CreateIndex
CREATE INDEX "alquiler_propietarioId_idx" ON "alquiler"("propietarioId");

-- CreateIndex
CREATE INDEX "alquiler_articuloId_idx" ON "alquiler"("articuloId");

-- CreateIndex
CREATE INDEX "alquiler_estado_idx" ON "alquiler"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "pago_alquilerId_key" ON "pago"("alquilerId");

-- CreateIndex
CREATE UNIQUE INDEX "pago_idTransaccion_key" ON "pago"("idTransaccion");

-- CreateIndex
CREATE UNIQUE INDEX "billetera_usuarioId_key" ON "billetera"("usuarioId");

-- CreateIndex
CREATE INDEX "transaccion_billetera_billeteraId_creadoEn_idx" ON "transaccion_billetera"("billeteraId", "creadoEn");

-- CreateIndex
CREATE INDEX "retiro_billeteraId_idx" ON "retiro"("billeteraId");

-- CreateIndex
CREATE INDEX "codigo_otp_telefono_codigo_idx" ON "codigo_otp"("telefono", "codigo");

-- CreateIndex
CREATE INDEX "codigo_otp_expiraEn_idx" ON "codigo_otp"("expiraEn");

-- CreateIndex
CREATE UNIQUE INDEX "token_refresco_hashToken_key" ON "token_refresco"("hashToken");

-- CreateIndex
CREATE INDEX "token_refresco_usuarioId_idx" ON "token_refresco"("usuarioId");

-- AddForeignKey
ALTER TABLE "articulo" ADD CONSTRAINT "articulo_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler" ADD CONSTRAINT "alquiler_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler" ADD CONSTRAINT "alquiler_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler" ADD CONSTRAINT "alquiler_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquiler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billetera" ADD CONSTRAINT "billetera_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaccion_billetera" ADD CONSTRAINT "transaccion_billetera_billeteraId_fkey" FOREIGN KEY ("billeteraId") REFERENCES "billetera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retiro" ADD CONSTRAINT "retiro_billeteraId_fkey" FOREIGN KEY ("billeteraId") REFERENCES "billetera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_otp" ADD CONSTRAINT "codigo_otp_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_refresco" ADD CONSTRAINT "token_refresco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
