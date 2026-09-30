/**
 * @file FormularioRetiroFondos.jsx
 * Formulario de retiro de fondos para la Historia de Usuario HU-10: Billetera Virtual y Retiro de Ganancias.
 *
 * Campos del formulario:
 * - Entidad Financiera (Selector dropdown):
 *   * Nequi
 *   * Daviplata
 *   * Ahorro a la Mano
 *   * Banco Colombia
 * - Número de Cuenta / Teléfono celular:
 *   * Validación de formato según la entidad seleccionada
 * - Monto a retirar:
 *   * Validación reactiva que impide ingresar valor mayor al saldo disponible
 *
 * Estados del formulario:
 * - idle: estado inicial, campos habilitados
 * - validating: mientras se verifica el monto vs saldo
 * - success: retiro aprobado (feedback visual)
 * - error: monto insuficiente o datos inválidos
 *
 * Validación reactiva:
 * - Se compara el monto ingresado vs saldo disponible (state global o mock)
 * - Si monto > saldo: mostrar error inline y deshabilitar botón de enviar
 * - Si monto ≤ saldo: habilitar botón y mostrar check verde
 *
 * Endpoints de producción:
 * - POST /api/wallet/withdraw (al enviar el formulario)
 *
 * Integración con Mock Data:
 * Cuando VITE_USAR_MOCK=true, el formulario usa valores simulados:
 * - Saldo de referencia: $125.000 COP
 * - Las entidades se seleccionan del dropdown
 * - El monto máximo permitido es el saldo disponible
 */

import React, { useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { useContext } from "react";
import { AuthContext } from "../../contexto/ContextoAutenticacion";
import AlertaToast from "../comunes/AlertaToast";
import { TarjetaIndicador } from "../comunes/TarjetaIndicador";
import IndicadorCarga from "../comunes/IndicadorCarga";

/**
 * FormularioRetiroFondos - Formulario para solicitar retiro de fondos
 *
 * Estructura del formulario:
 * <form onSubmit="manejarSubmit">
 *   <div className="grid grid-cols-2 gap-4">
 *     <div>
 *       <label>Entidad Financiera</label>
 *       <select name="entidad" className="...">...</select>
 *     </div>
 *     <div>
 *       <label>Número de Cuenta / Teléfono</label>
 *       <input type="text" ... />
 *     </div>
 *   </div>
 *   <div className="mt-4">
 *     <label>Monto a retirar</label>
 *     <input type="number" min="0" max={saldoDisponible} ... />
 *     // Error inline si monto > saldo
 *   </div>
 *   <button type="submit" className="btn-primary w-full">Solicitar Retiro</button>
 * </form>
 *
 * Manejo de estados visuales:
 * - Botón deshabilitado mientras hay validación de monto insuficiente
 * - Spinner IndicadorCarga mientras se procesa la solicitud
 * - AlertaToast de éxito/errors después de submit
 *
 * Flujo completo:
 * 1. Usuario completa campos y envía formulario
 * 2. Validación reactiva: monto ≤ saldo disponible
 * 3. Si válido: mostrar spinner, deshabilitar botón
 * 4. POST /api/wallet/withdraw con los datos
 * 5. Mostrar éxito o error según respuesta del backend
 */

const FormularioRetiroFondos = ({
  onSolicitarRetiro,
}) => {
  /** Estado para el selector de entidad financiera */
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("Nequi");

  /** Estado para el número de cuenta o teléfono */
  const [numeroCuenta, setNumeroCuenta] = useState("");

  /** Estado para el monto a retirar */
  const [montoRetiro, setMontoRetiro] = useState("");

  /** Estado de loading del formulario */
  const [loading, setLoading] = useState(false);

  /** Referencia al input de monto para validación */
  const inputMontoRef = useRef(null);

  /** Determinar el saldo máximo disponible (desde state padre o mock) */
  const saldoMaximo = 125000; // En producción vendría del context o API

  /** Validar si el monto es válido (≤ saldo disponible) */
  const esMontoValido = React.useMemo(() => {
    const montoNumero = parseFloat(montoRetiro);
    return !isNaN(montoNumero) && montoNumero <= (saldoMaximo || 0);
  }, [montoRetiro, saldoMaximo]);

  /** Manejador del cambio en el select de entidad */
  const manejarCambioEntidad = (e) => {
    setEntidadSeleccionada(e.target.value);
  };

  /** Manejador del cambio en el input de número de cuenta */
  const manejarCambioNumero = (e) => {
    setNumeroCuenta(e.target.value.replace(/\D/g, "")); // Solo números
  };

  /** Manejador del cambio en el input de monto */
  const manejarCambioMonto = (e) => {
    setMontoRetiro(e.target.value);
  };

  /** Manejador del submit del formulario */
  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (!esMontoValido) {
      // Mostrar alerta inline de saldo insuficiente
      return;
    }

    setLoading(true);
    try {
      await onSolicitarRetiro({
        entidad: entidadSeleccionada,
        numeroCuenta,
        monto: parseFloat(montoRetiro),
      });

      // Éxito: mostrar toast y resetear formulario
      setLoading(false);
      setEntidadSeleccionada("Nequi");
      setNumeroCuenta("");
      setMontoRetiro("");

      // TODO: AlertaToast éxito: "Retiro de $${monto} procesado correctamente"
    } catch (err) {
      setLoading(false);
      // TODO: AlertaToast error: mensaje del backend
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
      {/* Título del formulario */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Solicitar Retiro de Fondos
      </h2>

      {/* Formulario */}
      <form onSubmit={manejarSubmit} className="space-y-4">
        {/* Select: Entidad Financiera */}
        <div>
          <label htmlFor="entidadFinanciera" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Entidad Financiera
          </label>
          <select
            id="entidadFinanciera"
            value={entidadSeleccionada}
            onChange={manejarCambioEntidad}
            className="
              w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
              shadow-sm focus:ring-primary focus:border-primary
            "
          >
            <option value="Nequi">Nequi</option>
            <option value="Daviplata">Daviplata</option>
            <option value="Ahorro a la Mano">Ahorro a la Mano</option>
            <option value="Banco Colombia">Banco Colombia</option>
          </select>
        </div>

        {/* Input: Número de Cuenta / Teléfono celular */}
        <div>
          <label htmlFor="numeroCuenta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Cuenta / Teléfono
          </label>
          <input
            type="text"
            id="numeroCuenta"
            value={numeroCuenta}
            onChange={manejarCambioNumero}
            placeholder={entidadSeleccionada === "Daviplata" ||
              entidadSeleccionada === "Nequi"
                ? "Ej: 3101234567"
                : "Ej: 12345678-9"}
            className="
              w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
              shadow-sm focus:ring-primary focus:border-primary
            "
            aria-describedby="telefono-help"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" id="telefono-help">
            Ingresa tu número de Daviplata/Nequi o número de cuenta bancario
          </p>
        </div>

        {/* Input: Monto a retirar con validación reactiva */}
        <div>
          <label htmlFor="montoRetiro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monto a retirar
          </label>
          <div className="relative">
            <input
              type="number"
              id="montoRetiro"
              value={montoRetiro}
              onChange={manejarCambioMonto}
              min="0"
              max={saldoMaximo}
              step="5000"
              className="
                w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                shadow-sm focus:ring-primary focus:border-primary
                appearance-none
              "
              placeholder="0"
              aria-invalid={!esMontoValido}
              aria-describedby="monto-error"
            />
            {/* Ícono de validación */}
            {(!esMontoValido || montoRetiro > 0) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {esMontoValido ? "✓" : "⚠"}
              </span>
            )}
          </div>
          {/* Mensaje de error inline si el monto es inválido */}
          {(!esMontoValido && montoRetiro > 0) && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1" id="monto-error">
              El monto no puede ser mayor al saldo disponible (${saldoMaximo.toLocaleString()})
            </p>
          )}
          {/* Mostrar saldo disponible como referencia */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Saldo disponible: ${saldoMaximo.toLocaleString()}
          </p>
        </div>

        {/* Botón de enviar con estado loading */}
        <button
          type="submit"
          disabled={loading || !esMontoValido}
          className={` w-full py-3 px-6 rounded-full font-medium transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            focus-visible:ring-offset-2 ${loading ? "opacity-50 cursor-not-allowed" : ""} ${loading ? "bg-primary/20" : "bg-primary"}
            text-white`}
        >
          {loading ? (
            <IndicadorCarga texto="Procesando" tamaño="sm" />
          ) : (
            "Solicitar Retiro"
          )}
        </button>
      </form>

      {/* Toast de AlertaToast se mostrará desde el padre después de onSolicitarRetiro */}
      <AlertaToast tipo="éxito" mensaje="Retiro procesado" />
    </div>
  );
};


export default FormularioRetiroFondos;