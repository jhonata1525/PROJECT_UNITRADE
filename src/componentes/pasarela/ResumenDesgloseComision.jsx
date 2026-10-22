/**
 * @file ResumenDesgloseComision.jsx
 * Resumen visual del desglose de un pago (HU-06).
 *
 * Regla de negocio:
 * - El arrendatario paga el subtotal.
 * - UniTrade retiene el 12% de comisión.
 * - El propietario recibe el subtotal menos la comisión.
 */

import React from "react";
import { TarjetaIndicador } from "../comunes/TarjetaIndicador";

const COMISION_PORCENTAJE = 0.12;

const ResumenDesgloseComision = ({
  subtotal = 0,
  comision = 0,
  total = 0,
  montoPropietario = 0,
  porcentajeComision = COMISION_PORCENTAJE,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium text-gray-400">
          Desglose de comisión UniTrade ({(porcentajeComision * 100).toFixed(0)}%)
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          El arrendatario paga el subtotal. La comisión se descuenta de lo que
          recibe el propietario.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaIndicador
          titulo="Subtotal Alquiler"
          valor={subtotal}
          claseColor="text-green-400"
          mostarFlecha={false}
        />
        <TarjetaIndicador
          titulo="Comisión UniTrade"
          valor={comision}
          claseColor="text-red-400"
          mostarFlecha={false}
        />
        <TarjetaIndicador
          titulo="Total a Pagar"
          valor={total}
          claseColor="text-blue-400"
          mostarFlecha={false}
        />
        <TarjetaIndicador
          titulo="Recibe el Propietario"
          valor={montoPropietario}
          claseColor="text-emerald-400"
          mostarFlecha={false}
        />
      </div>
    </div>
  );
};

export default ResumenDesgloseComision;
