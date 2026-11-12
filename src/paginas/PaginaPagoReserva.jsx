/**
 * @file PaginaPagoReserva.jsx
 * Historial de pagos realizados por el usuario.
 *
 * Las nuevas reservas se inician desde el catálogo y su pago se confirma
 * durante la reserva.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { useAuth } from "../contexto/ContextoAutenticacion";
import {
  mensajeErrorPagos,
  obtenerHistorialPagos,
} from "../servicios/servicioPagos";

const formatearCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(valor) || 0);

const formatearFecha = (fecha) => {
  const fechaPago = new Date(fecha);
  if (Number.isNaN(fechaPago.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fechaPago);
};

const ESTADOS_PAGO = {
  COMPLETADO: {
    etiqueta: "Completado",
    clases: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Icono: CheckCircle2,
  },
  PENDIENTE: {
    etiqueta: "Pendiente",
    clases: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Icono: Clock3,
  },
  PROCESANDO: {
    etiqueta: "Procesando",
    clases: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    Icono: Clock3,
  },
  FALLIDO: {
    etiqueta: "Fallido",
    clases: "border-red-500/30 bg-red-500/10 text-red-300",
    Icono: AlertCircle,
  },
};

export default function PaginaPagoReserva() {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const [pagos, setPagos] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState("");
  const [numeroRecarga, setNumeroRecarga] = React.useState(0);

  React.useEffect(() => {
    if (!usuarioId) return undefined;

    let activo = true;
    obtenerHistorialPagos(usuarioId, 50)
      .then((resultado) => {
        if (!Array.isArray(resultado)) {
          throw new Error("El servidor devolvió un historial de pagos inválido.");
        }
        if (activo) {
          setPagos(resultado);
          setError("");
        }
      })
      .catch((err) => {
        if (activo) {
          setError(
            mensajeErrorPagos(err, "No se pudo cargar el historial de pagos."),
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuarioId, numeroRecarga]);

  const reintentar = () => {
    setError("");
    setCargando(true);
    setNumeroRecarga((actual) => actual + 1);
  };
  const errorVisible = usuarioId
    ? error
    : "No se pudo identificar al usuario. Vuelve a iniciar sesión.";
  const mostrandoCarga = Boolean(usuarioId && cargando);

  return (
    <div className="min-h-screen text-gray-100">
      <NavegacionLateral />

      <main className="max-w-7xl mx-auto transition-all duration-300 content-sidebar min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6 px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Panel
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pagos</h1>
            <p className="mt-1 text-gray-400">
              Consulta los pagos y reservas realizados desde tu billetera.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center gap-2 btn-primary px-4 py-2"
          >
            <ShoppingBag className="h-4 w-4" /> Reservar un artículo
          </Link>
        </div>

        {errorVisible && (
          <div
            className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            role="alert"
          >
            <span>{errorVisible}</span>
            <button
              type="button"
              onClick={reintentar}
              className="inline-flex shrink-0 items-center gap-2 text-red-200 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        )}

        {mostrandoCarga ? (
          <div className="glass-card p-8 text-center text-gray-400" role="status">
            Cargando pagos...
          </div>
        ) : !errorVisible && pagos.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-500" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Aún no tienes pagos
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Cuando reserves un artículo, el pago aparecerá aquí. La reserva y
              el pago se confirman juntos desde el catálogo.
            </p>
            <Link
              to="/catalogo"
              className="mt-5 inline-flex items-center gap-2 btn-primary px-5 py-2"
            >
              <ShoppingBag className="h-4 w-4" /> Explorar artículos
            </Link>
          </div>
        ) : !errorVisible ? (
          <div className="space-y-3">
            {pagos.map((pago) => {
              const estado = ESTADOS_PAGO[pago.estado] ?? {
                etiqueta: pago.estado || "Sin estado",
                clases: "border-gray-500/30 bg-gray-500/10 text-gray-300",
                Icono: Clock3,
              };
              const IconoEstado = estado.Icono;
              return (
                <article
                  key={pago.id}
                  className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-white">
                        {pago.articulo || pago.concepto || "Pago de reserva"}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400">
                        {formatearFecha(pago.fecha)}
                      </p>
                      {pago.transaccionId && (
                        <p className="mt-1 break-all font-mono text-xs text-gray-500">
                          Transacción: {pago.transaccionId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatearCOP(pago.monto)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Comisión: {formatearCOP(pago.comision)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${estado.clases}`}
                    >
                      <IconoEstado className="h-3.5 w-3.5" />
                      {estado.etiqueta}
                    </span>
                  </div>
                  {pago.error && (
                    <p className="basis-full text-sm text-red-300">{pago.error}</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
