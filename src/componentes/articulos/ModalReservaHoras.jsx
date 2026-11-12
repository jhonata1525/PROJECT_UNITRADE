/**
 * @file ModalReservaHoras.jsx
 * Reserva y pago por horas (HU-05 + HU-06).
 *
 * El pago se procesa en el backend desde la billetera del arrendatario:
 * - El arrendatario paga el subtotal.
 * - UniTrade retiene el 12% de comisión.
 * - El propietario recibe el resto en su billetera.
 *
 * Si el saldo es insuficiente, la reserva no se confirma y se debe recargar.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  ShieldCheck,
  Receipt,
  Ban,
} from "lucide-react";
import PinInput from "../comunes/PinInput";
import { useAuth } from "../../contexto/ContextoAutenticacion";
import { obtenerAgendaArticulo } from "../../servicios/servicioArticulos";
import {
  generarClaveIdempotencia,
  mensajeErrorPagos,
  procesarCheckout,
} from "../../servicios/servicioPagos";

const COMISION = 0.12;
const DIAS_A_MOSTRAR = 14;
const DIAS_POR_INDICE = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const formatHora = (hora) => `${hora.toString().padStart(2, "0")}:00`;

/** Convierte "08:30" a minutos desde medianoche. */
const aMinutos = (hora) => {
  const [h, m] = String(hora ?? "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

/** Devuelve la franja activa del dueño para una fecha concreta. */
const obtenerFranjaDelDia = (disponibilidad, fecha) => {
  if (!disponibilidad || typeof disponibilidad !== "object") return null;
  const diaId = DIAS_POR_INDICE[fecha.getDay()];
  const franja = disponibilidad[diaId];
  if (!franja?.activo) return null;

  const inicioMin = aMinutos(franja.inicio);
  const finMin = aMinutos(franja.fin);
  if (inicioMin === null || finMin === null || inicioMin >= finMin) return null;

  return { diaId, inicioMin, finMin };
};

const claveFecha = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
    fecha.getDate(),
  ).padStart(2, "0")}`;

/**
 * Construye las fechas reservables a partir de la disponibilidad del dueño.
 * Solo incluye días con franja activa y horas enteras que aún no han pasado.
 */
const construirOpcionesFecha = (disponibilidad) => {
  const ahora = new Date();
  const opciones = [];

  for (let desplazamiento = 0; desplazamiento < DIAS_A_MOSTRAR; desplazamiento += 1) {
    const fecha = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate() + desplazamiento,
    );
    const franja = obtenerFranjaDelDia(disponibilidad, fecha);
    if (!franja) continue;

    const inicioHora = Math.ceil(franja.inicioMin / 60);
    const finHora = Math.floor(franja.finMin / 60);
    let primerInicio = inicioHora;

    // Si es hoy, descarta las horas que ya empezaron.
    if (desplazamiento === 0) {
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      while (primerInicio < finHora && primerInicio * 60 <= minutosActuales) {
        primerInicio += 1;
      }
    }

    if (primerInicio >= finHora) continue;

    opciones.push({
      clave: claveFecha(fecha),
      fecha,
      inicioHora: primerInicio,
      finHora,
    });
  }

  return opciones;
};

const formatFechaOpcion = (fecha) => {
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(fecha);
  return `${esHoy ? "Hoy · " : ""}${texto}`;
};

const formatCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);

const formatFecha = (fecha) =>
  new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(fecha);

/**
 * Convierte los rangos ocupados que devuelve la agenda en minutos desde
 * la medianoche de la fecha indicada (recortando los que cruzan de día).
 */
const rangosOcupadosDelDia = (ocupados, fecha) => {
  if (!Array.isArray(ocupados) || ocupados.length === 0) return [];

  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  return ocupados
    .map((rango) => {
      const inicio = new Date(rango?.inicio);
      const fin = new Date(rango?.fin);
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
        return null;
      }

      const desde = Math.max(inicio.getTime(), inicioDia.getTime());
      const hasta = Math.min(fin.getTime(), finDia.getTime());
      if (hasta <= desde) return null;

      return {
        inicioMin: Math.floor((desde - inicioDia.getTime()) / 60000),
        finMin: Math.ceil((hasta - inicioDia.getTime()) / 60000),
      };
    })
    .filter(Boolean);
};

/** Horas enteras [h, h+1] que chocan con algún rango ocupado. */
const horasOcupadasDelDia = (rangos, desdeHora, hastaHora) => {
  const ocupadas = new Set();

  for (let hora = desdeHora; hora < hastaHora; hora += 1) {
    const inicio = hora * 60;
    const fin = inicio + 60;
    if (rangos.some((rango) => inicio < rango.finMin && fin > rango.inicioMin)) {
      ocupadas.add(hora);
    }
  }

  return ocupadas;
};

/** Agrupa horas consecutivas para mostrarlas como bloques 08:00–10:00. */
const agruparHoras = (horas) => {
  const ordenadas = [...horas].sort((a, b) => a - b);
  const bloques = [];

  ordenadas.forEach((hora) => {
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.fin === hora) {
      ultimo.fin = hora + 1;
    } else {
      bloques.push({ inicio: hora, fin: hora + 1 });
    }
  });

  return bloques;
};

export const ModalReservaHoras = ({
  isOpen,
  onClose,
  articulo,
  onReservaExitosa,
}) => {
  const { usuario } = useAuth();

  const [agenda, setAgenda] = useState(null);
  const [cargandoAgenda, setCargandoAgenda] = useState(false);
  const [errorAgenda, setErrorAgenda] = useState("");

  // La agenda del backend manda; el catálogo es el respaldo inmediato.
  const disponibilidad = useMemo(
    () => agenda?.disponibilidad ?? articulo?.propietario?.disponibilidad ?? null,
    [agenda, articulo],
  );

  // Solo se ofrecen días y horas dentro de la disponibilidad del dueño.
  const opcionesFecha = useMemo(
    () => construirOpcionesFecha(disponibilidad),
    [disponibilidad, isOpen],
  );

  const [claveFechaSeleccionada, setClaveFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState(8);
  const [horaFin, setHoraFin] = useState(9);
  const [confirmando, setConfirmando] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);
  const [error, setError] = useState("");
  const [saldoInsuficiente, setSaldoInsuficiente] = useState(false);
  const idempotenciaRef = useRef(null);

  const opcionSeleccionada = useMemo(
    () =>
      opcionesFecha.find((opcion) => opcion.clave === claveFechaSeleccionada) ??
      opcionesFecha[0] ??
      null,
    [opcionesFecha, claveFechaSeleccionada],
  );

  // Horas ocupadas por fecha, según la agenda de reservas activas.
  const ocupadosPorFecha = useMemo(() => {
    const mapa = new Map();
    if (!Array.isArray(agenda?.ocupados) || agenda.ocupados.length === 0) {
      return mapa;
    }

    opcionesFecha.forEach((opcion) => {
      const rangos = rangosOcupadosDelDia(agenda.ocupados, opcion.fecha);
      mapa.set(
        opcion.clave,
        horasOcupadasDelDia(rangos, opcion.inicioHora, opcion.finHora),
      );
    });

    return mapa;
  }, [agenda, opcionesFecha]);

  const horasOcupadas = useMemo(
    () =>
      opcionSeleccionada
        ? ocupadosPorFecha.get(opcionSeleccionada.clave) ?? new Set()
        : new Set(),
    [opcionSeleccionada, ocupadosPorFecha],
  );

  // Solo se pueden iniciar reservas en horas que no estén ocupadas.
  const horasInicioDisponibles = useMemo(() => {
    if (!opcionSeleccionada) return [];
    const libres = [];
    for (
      let hora = opcionSeleccionada.inicioHora;
      hora < opcionSeleccionada.finHora;
      hora += 1
    ) {
      if (!horasOcupadas.has(hora)) libres.push(hora);
    }
    return libres;
  }, [opcionSeleccionada, horasOcupadas]);

  // Se calculan horas efectivas para que un cambio de agenda no deje
  // seleccionado un horario inválido mientras el usuario interactúa.
  const horaInicioEfectiva = useMemo(() => {
    if (horasInicioDisponibles.length === 0) return null;
    return horasInicioDisponibles.includes(horaInicio)
      ? horaInicio
      : horasInicioDisponibles[0];
  }, [horaInicio, horasInicioDisponibles]);

  // El fin solo puede avanzar mientras las horas anteriores estén libres.
  const horasFinDisponibles = useMemo(() => {
    if (!opcionSeleccionada || horaInicioEfectiva === null) return [];
    const fines = [];
    for (
      let hora = horaInicioEfectiva + 1;
      hora <= opcionSeleccionada.finHora;
      hora += 1
    ) {
      if (horasOcupadas.has(hora - 1)) break;
      fines.push(hora);
    }
    return fines;
  }, [opcionSeleccionada, horaInicioEfectiva, horasOcupadas]);

  const horaFinEfectiva = useMemo(() => {
    if (horasFinDisponibles.length === 0) return null;
    return horasFinDisponibles.includes(horaFin)
      ? horaFin
      : horasFinDisponibles[0];
  }, [horaFin, horasFinDisponibles]);

  const inicio = useMemo(() => {
    if (!opcionSeleccionada || horaInicioEfectiva === null) return null;
    const fecha = new Date(opcionSeleccionada.fecha);
    fecha.setHours(horaInicioEfectiva, 0, 0, 0);
    return fecha;
  }, [opcionSeleccionada, horaInicioEfectiva]);

  const fin = useMemo(() => {
    if (!opcionSeleccionada || horaFinEfectiva === null) return null;
    const fecha = new Date(opcionSeleccionada.fecha);
    fecha.setHours(horaFinEfectiva, 0, 0, 0);
    return fecha;
  }, [opcionSeleccionada, horaFinEfectiva]);

  const esHoy = opcionSeleccionada
    ? opcionSeleccionada.fecha.toDateString() === new Date().toDateString()
    : false;
  const sinDisponibilidad = opcionesFecha.length === 0;
  const sinHorasLibres =
    Boolean(opcionSeleccionada) && horasInicioDisponibles.length === 0;

  const horasSeleccionadas =
    horaInicioEfectiva !== null && horaFinEfectiva !== null
      ? Math.max(0, horaFinEfectiva - horaInicioEfectiva)
      : 0;
  const tarifaHora = Number(articulo?.precioPorDia) || 0;
  const subtotal = horasSeleccionadas * tarifaHora;
  const comision = Math.round(subtotal * COMISION);
  const total = subtotal;
  const montoPropietario = subtotal - comision;

  // Consulta la agenda real: franjas del dueño + reservas que ya ocupan horas.
  useEffect(() => {
    if (!isOpen || !articulo?.id) {
      setAgenda(null);
      setCargandoAgenda(false);
      setErrorAgenda("");
      return undefined;
    }

    let cancelado = false;
    setAgenda(null);
    setErrorAgenda("");
    setCargandoAgenda(true);

    obtenerAgendaArticulo(articulo.id)
      .then((data) => {
        if (!cancelado) setAgenda(data);
      })
      .catch(() => {
        if (!cancelado) {
          setErrorAgenda(
            "No pudimos verificar los horarios ocupados. El backend validará el horario al pagar.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoAgenda(false);
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen, articulo?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const primera = opcionesFecha[0] ?? null;
    setReservaConfirmada(null);
    setError("");
    setSaldoInsuficiente(false);
    setClaveFechaSeleccionada(primera?.clave ?? null);
    setHoraInicio(primera?.inicioHora ?? 8);
    setHoraFin(primera ? Math.min(primera.inicioHora + 1, primera.finHora) : 9);
    idempotenciaRef.current = null;
    // Solo se reinicia al abrir el modal o cambiar de artículo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, articulo?.id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !reservaConfirmada && !confirmando) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, reservaConfirmada, confirmando, onClose]);

  const manejarCambioFecha = (clave) => {
    const opcion = opcionesFecha.find((item) => item.clave === clave);
    if (!opcion) return;

    const ocupadas = ocupadosPorFecha.get(clave) ?? new Set();
    let primerLibre = opcion.inicioHora;
    while (primerLibre < opcion.finHora && ocupadas.has(primerLibre)) {
      primerLibre += 1;
    }

    setClaveFechaSeleccionada(clave);
    setHoraInicio(primerLibre);
    setHoraFin(Math.min(primerLibre + 1, opcion.finHora));
    setError("");
  };

  const manejarCambioInicio = (valor) => {
    const nuevaHora = Number(valor);
    setHoraInicio(nuevaHora);
    if (horaFinEfectiva === null || horaFinEfectiva <= nuevaHora) {
      setHoraFin(
        Math.min(
          nuevaHora + 1,
          opcionSeleccionada?.finHora ?? nuevaHora + 1,
        ),
      );
    }
  };

  const diaSinCupo = (opcion) => {
    const ocupadas = ocupadosPorFecha.get(opcion.clave);
    if (!ocupadas || ocupadas.size === 0) return false;
    for (let hora = opcion.inicioHora; hora < opcion.finHora; hora += 1) {
      if (!ocupadas.has(hora)) return false;
    }
    return true;
  };

  const bloquesOcupados = useMemo(
    () => agruparHoras(horasOcupadas),
    [horasOcupadas],
  );

  const handleConfirmar = async () => {
    if (!usuario?.id) {
      setError("No se pudo identificar al usuario. Vuelve a iniciar sesión.");
      return;
    }
    if (!articulo?.id) {
      setError("No se seleccionó ningún artículo.");
      return;
    }
    if (
      !opcionSeleccionada ||
      !inicio ||
      !fin ||
      horaInicioEfectiva === null ||
      horaFinEfectiva === null
    ) {
      setError(
        "No hay horas libres para este día. Elige otra fecha disponible.",
      );
      return;
    }
    if (tarifaHora <= 0) {
      setError("El artículo no tiene una tarifa por hora válida.");
      return;
    }

    setConfirmando(true);
    setError("");

    try {
      if (!idempotenciaRef.current) {
        idempotenciaRef.current = generarClaveIdempotencia();
      }

      const respuesta = await procesarCheckout(
        usuario.id,
        {
          articuloId: articulo.id,
          horas: horasSeleccionadas,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          metodo: "billetera",
        },
        idempotenciaRef.current,
      );

      if (!respuesta?.exito) {
        throw new Error(respuesta?.mensaje || "El pago no fue aprobado.");
      }

      if (!respuesta.codigoEntrega) {
        throw new Error(
          "El pago se aprobó, pero no se recibió el código de entrega. Consulta Mis Alquileres antes de entregar el artículo.",
        );
      }

      const reserva = {
        id: respuesta.alquilerId,
        pagoId: respuesta.pagoId,
        transaccionId: respuesta.transaccionId,
        articuloId: articulo.id,
        articuloNombre: articulo.nombre,
        horaInicio: formatHora(horaInicioEfectiva),
        horaFin: formatHora(horaFinEfectiva),
        fecha: inicio.toISOString(),
        fechaTexto: `${esHoy ? "Hoy · " : ""}${formatFecha(inicio)}`,
        horas: horasSeleccionadas,
        tarifaHora,
        total: respuesta.desglose?.total ?? total,
        desglose: respuesta.desglose ?? {
          subtotal,
          comision,
          total,
          montoPropietario,
          porcentajeComision: COMISION,
        },
        pin: respuesta.codigoEntrega,
        estado: respuesta.estado,
        mensaje: respuesta.mensaje,
      };

      setReservaConfirmada(reserva);
      onReservaExitosa?.(reserva);
    } catch (err) {
      setError(mensajeErrorPagos(err, "No se pudo procesar el pago."));
      setSaldoInsuficiente(
        err?.response?.data?.codigo === "SALDO_INSUFICIENTE",
      );
      // Una nueva intención necesita una nueva clave si la anterior falló.
      idempotenciaRef.current = null;
    } finally {
      setConfirmando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reserva-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !reservaConfirmada && !confirmando && onClose()}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in">
          {!reservaConfirmada && (
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
              <h2
                id="modal-reserva-title"
                className="text-xl font-bold text-white"
              >
                Reservar por Horas
              </h2>
              <button
                onClick={onClose}
                disabled={confirmando}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="p-5 space-y-5">
            {!reservaConfirmada && (
              <>
                <div className="glass-panel p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-canvas)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {articulo?.fotoUrl ? (
                        <img
                          src={articulo.fotoUrl}
                          alt={articulo.nombre}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {articulo?.nombre}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatCOP(tarifaHora)} / hora
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-neon)]" />
                    Fecha y horario
                  </h4>

                  {sinDisponibilidad ? (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        Este propietario no tiene franjas de disponibilidad
                        configuradas, así que no es posible reservar por ahora.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-1">
                          Fecha
                        </label>
                        <select
                          value={opcionSeleccionada?.clave ?? ""}
                          onChange={(e) => manejarCambioFecha(e.target.value)}
                          className="glass-input bg-[var(--color-surface)] cursor-pointer"
                          disabled={confirmando}
                          aria-label="Fecha de la reserva"
                        >
                          {opcionesFecha.map((opcion) => (
                            <option key={opcion.clave} value={opcion.clave}>
                              {formatFechaOpcion(opcion.fecha)}
                              {diaSinCupo(opcion) ? " · Sin cupo" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-xs text-gray-400">
                        {cargandoAgenda ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-[var(--color-neon)]" />
                            <span>Verificando horarios ocupados…</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-neon)]" />
                            <span>
                              El propietario está disponible de{" "}
                              <span className="font-medium text-gray-200">
                                {formatHora(opcionSeleccionada.inicioHora)} a{" "}
                                {formatHora(opcionSeleccionada.finHora)}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      {errorAgenda && !cargandoAgenda && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>{errorAgenda}</span>
                        </div>
                      )}

                      {!cargandoAgenda && bloquesOcupados.length > 0 && (
                        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-red-300">
                            <Ban className="h-3.5 w-3.5" />
                            Horarios ya ocupados
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {bloquesOcupados.map((bloque) => (
                              <span
                                key={`${bloque.inicio}-${bloque.fin}`}
                                className="inline-flex items-center rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-200"
                              >
                                {formatHora(bloque.inicio)}–{formatHora(bloque.fin)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sinHorasLibres ? (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>
                            No quedan horas libres para este día. Elige otra
                            fecha disponible.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Hora de inicio
                              </label>
                              <select
                                value={horaInicioEfectiva ?? ""}
                                onChange={(e) =>
                                  manejarCambioInicio(e.target.value)
                                }
                                className="glass-input bg-[var(--color-surface)] cursor-pointer"
                                disabled={confirmando}
                              >
                                {horasInicioDisponibles.map((h) => (
                                  <option key={h} value={h}>
                                    {formatHora(h)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">
                                Hora de fin
                              </label>
                              <select
                                value={horaFinEfectiva ?? ""}
                                onChange={(e) =>
                                  setHoraFin(Number(e.target.value))
                                }
                                className="glass-input bg-[var(--color-surface)] cursor-pointer"
                                disabled={confirmando}
                              >
                                {horasFinDisponibles.map((h) => (
                                  <option key={h} value={h}>
                                    {formatHora(h)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {horasSeleccionadas} hora
                            {horasSeleccionadas !== 1 ? "s" : ""} seleccionada
                            {horasSeleccionadas !== 1 ? "s" : ""}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="glass-panel p-4 bg-gradient-to-r from-[var(--color-neon)]/5 to-[var(--color-accent-500)]/5 border-[var(--color-neon)]/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tarifa por hora</span>
                      <span className="font-medium text-white">
                        {formatCOP(tarifaHora)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Horas</span>
                      <span className="font-medium text-white">
                        {horasSeleccionadas} h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="font-medium text-white">
                        {formatCOP(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">
                        Comisión UniTrade (12%)
                      </span>
                      <span className="text-xs text-gray-400">
                        -{formatCOP(comision)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                      <span className="text-white font-medium">
                        Total a pagar
                      </span>
                      <span className="text-xl font-bold text-[var(--color-neon)]">
                        {formatCOP(total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Recibe el propietario</span>
                      <span className="font-mono">
                        {formatCOP(montoPropietario)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Pago desde tu billetera
                  </h4>
                  <p className="text-sm text-gray-400">
                    Se descontarán {formatCOP(total)} de tu saldo disponible.
                    Si no alcanza, tendrás que recargar la billetera antes de
                    reservar. El propietario recibirá el valor menos la comisión.
                  </p>
                </div>

                {error && (
                  <div
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {error}
                      {saldoInsuficiente && (
                        <Link
                          to="/billetera"
                          className="block mt-2 font-medium text-[var(--color-neon)] hover:underline"
                        >
                          Ir a mi billetera para recargar
                        </Link>
                      )}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    disabled={confirmando}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={
                      confirmando ||
                      tarifaHora <= 0 ||
                      sinDisponibilidad ||
                      sinHorasLibres ||
                      cargandoAgenda
                    }
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pagar y reservar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {reservaConfirmada && (
              <>
                <div className="text-center py-3">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Pago aprobado y reserva creada
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {reservaConfirmada.articuloNombre} ·{" "}
                    {reservaConfirmada.fechaTexto}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Pagado desde la billetera
                  </span>
                </div>

                <div className="glass-panel p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora inicio</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horaInicio}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora fin</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horaFin}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Duración</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horas}h
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Total pagado</p>
                      <p className="font-mono text-lg font-bold text-[var(--color-neon)]">
                        {formatCOP(reservaConfirmada.total)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <p className="mb-2 flex items-center gap-2 font-medium text-white">
                      <Receipt className="w-4 h-4" /> Recibo del pago
                    </p>
                    <div className="space-y-1 text-gray-400">
                      <div className="flex justify-between gap-3">
                        <span>Subtotal</span>
                        <span className="font-mono text-gray-200">
                          {formatCOP(reservaConfirmada.desglose.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Comisión UniTrade (12%)</span>
                        <span className="font-mono text-gray-200">
                          -{formatCOP(reservaConfirmada.desglose.comision)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Recibe el propietario</span>
                        <span className="font-mono text-gray-200">
                          {formatCOP(
                            reservaConfirmada.desglose.montoPropietario,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-[var(--color-border)] pt-1">
                        <span>Estado del pago</span>
                        <span className="font-mono text-emerald-400">
                          {reservaConfirmada.estado}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Transacción</span>
                        <span className="font-mono text-xs break-all text-right text-gray-300">
                          {reservaConfirmada.transaccionId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--color-neon)]/10 to-[var(--color-accent-500)]/10 border border-[var(--color-neon)]/30">
                    <p className="text-xs text-gray-400 mb-2">
                      Código para confirmar la entrega
                    </p>
                    <div className="flex justify-center">
                      <PinInput
                        value={reservaConfirmada.pin}
                        onChange={() => {}}
                        disabled
                        autoFocus={false}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Guarda este código y muéstraselo al propietario cuando
                      recibas el artículo. También podrás consultarlo en Mis
                      Alquileres.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setReservaConfirmada(null);
                      onClose();
                    }}
                    className="flex-1 btn-primary"
                  >
                    Finalizar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalReservaHoras;
