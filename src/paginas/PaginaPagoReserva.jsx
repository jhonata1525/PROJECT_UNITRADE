/**
 * @file PaginaPagoReserva.jsx
 * Página de confirmación de pago de una reserva (HU-06).
 *
 * Recibe el artículo por `location.state` (por ejemplo, desde el catálogo).
 * Si no hay artículo, invita a elegir uno en el catálogo.
 */

import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import ModalConfirmacionPago from "../componentes/pasarela/ModalConfirmacionPago";
import ResumenDesgloseComision from "../componentes/pasarela/ResumenDesgloseComision";

const COMISION = 0.12;

export default function PaginaPagoReserva() {
  const location = useLocation();
  const navigate = useNavigate();
  const articulo = location.state?.articulo || null;
  const horasIniciales = Number(location.state?.horas) || 1;
  const [pago, setPago] = useState(null);

  const desglose = useMemo(() => {
    const tarifaHora = Number(articulo?.precioPorDia) || 0;
    const subtotal = horasIniciales * tarifaHora;
    const comision = Math.round(subtotal * COMISION);
    return {
      subtotal,
      comision,
      total: subtotal,
      montoPropietario: subtotal - comision,
      porcentajeComision: COMISION,
    };
  }, [articulo, horasIniciales]);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <NavegacionLateral />

      <main className="max-w-7xl mx-auto transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6 px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pago y Reserva</h1>
          <p className="mt-1 text-gray-400">
            Confirma el pago desde tu billetera y revisa el desglose de la comisión.
          </p>
        </div>

        {!articulo ? (
          <div className="glass-card p-8 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-500" />
            <h2 className="mt-4 text-lg font-semibold text-white">
              No hay una reserva en curso
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Para pagar una reserva, primero elige un artículo disponible en el
              catálogo.
            </p>
            <Link
              to="/catalogo"
              className="mt-5 inline-flex items-center gap-2 btn-primary px-5 py-2"
            >
              <ShoppingBag className="w-4 h-4" /> Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <ResumenDesgloseComision
                subtotal={pago?.desglose?.subtotal ?? desglose.subtotal}
                comision={pago?.desglose?.comision ?? desglose.comision}
                total={pago?.desglose?.total ?? desglose.total}
                montoPropietario={
                  pago?.desglose?.montoPropietario ?? desglose.montoPropietario
                }
                porcentajeComision={desglose.porcentajeComision}
              />
              <ModalConfirmacionPago
                articulo={articulo}
                horasIniciales={horasIniciales}
                onSuccess={setPago}
              />
            </div>

            <aside className="xl:col-span-1">
              <div className="glass-card p-5 text-sm text-gray-400 space-y-3">
                <h2 className="font-semibold text-white">¿Cómo funciona?</h2>
                <p>
                  1. El total se descuenta del saldo disponible de tu billetera.
                </p>
                <p>
                  2. UniTrade retiene el 12% de comisión sobre el subtotal.
                </p>
                <p>
                  3. El resto se abona automáticamente a la billetera del
                  propietario.
                </p>
                <p className="text-xs text-amber-300">
                  Si el saldo no alcanza, recarga la billetera para continuar.
                </p>
                <Link to="/billetera" className="inline-block text-[var(--color-neon)] hover:underline">
                  Ver mi billetera
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
