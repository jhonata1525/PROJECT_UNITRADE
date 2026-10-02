/**
 * @file servicioBilletera.js
 * Servicio mock para la billetera virtual de UniTrade (HU-10).
 * Maneja balance, historial de transacciones y retiros usando localStorage para persistencia.
 */

const STORAGE_KEYS = {
  BALANCE: "untrade_wallet_balance",
  HISTORIAL: "untrade_wallet_historial",
  ENTIDADES: "untrade_wallet_entidades",
};

/** Inicializa datos mock en localStorage si no existen */
const inicializarDatosMock = () => {
  if (!localStorage.getItem(STORAGE_KEYS.BALANCE)) {
    const balanceInicial = {
      saldoDisponible: 125000,
      totalGanado: 450000,
      retirosProceso: 0,
    };
    localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(balanceInicial));
  }

  if (!localStorage.getItem(STORAGE_KEYS.HISTORIAL)) {
    const historialInicial = [
      {
        id: "tx-001",
        tipo: "INGRESO",
        concepto: "Alquiler - Mesa de estudio",
        monto: 50000,
        fecha: "2024-01-15",
        estado: "COMPLETADO",
        destino: "Billetera UniTrade",
      },
      {
        id: "tx-002",
        tipo: "INGRESO",
        concepto: "Alquiler - Silla ergonómica",
        monto: 30000,
        fecha: "2024-01-10",
        estado: "COMPLETADO",
        destino: "Billetera UniTrade",
      },
    ];
    localStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(historialInicial));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ENTIDADES)) {
    const entidades = [
      { valor: "Nequi", label: "Nequi" },
      { valor: "Daviplata", label: "Daviplata" },
      { valor: "Ahorro a la Mano", label: "Ahorro a la Mano" },
      { valor: "Banco Colombia", label: "Banco Colombia" },
    ];
    localStorage.setItem(STORAGE_KEYS.ENTIDADES, JSON.stringify(entidades));
  }
};

/** Genera ID único para transacciones */
const generarId = () => `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/** Obtiene balance actual desde localStorage */
export const obtenerBalance = async () => {
  inicializarDatosMock();
  const data = localStorage.getItem(STORAGE_KEYS.BALANCE);
  return data ? JSON.parse(data) : { saldoDisponible: 0, totalGanado: 0, retirosProceso: 0 };
};

/** Obtiene historial de transacciones desde localStorage */
export const obtenerHistorialTransacciones = async () => {
  inicializarDatosMock();
  const data = localStorage.getItem(STORAGE_KEYS.HISTORIAL);
  return data ? JSON.parse(data) : [];
};

/** Obtiene lista de entidades financieras */
export const listarEntidades = async () => {
  inicializarDatosMock();
  const data = localStorage.getItem(STORAGE_KEYS.ENTIDADES);
  return data ? JSON.parse(data) : [];
};

/**
 * Solicita retiro de fondos
 * Valida que el monto no supere el saldo disponible
 * Actualiza balance y agrega transacción al historial
 */
export const solicitarRetiro = async (datosRetiro) => {
  const { entidadFinanciera, numeroCuenta, monto } = datosRetiro;

  if (!entidadFinanciera || !monto) {
    throw new Error("Entidad financiera y monto son obligatorios");
  }

  const balance = await obtenerBalance();

  if (monto > balance.saldoDisponible) {
    throw new Error(`Monto insuficiente. Saldo disponible: ${balance.saldoDisponible.toLocaleString()} COP`);
  }

  /** Actualiza balance */
  const nuevoBalance = {
    ...balance,
    saldoDisponible: balance.saldoDisponible - monto,
    retirosProceso: balance.retirosProceso + 1,
  };
  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(nuevoBalance));

  /** Agrega transacción al historial */
  const historial = await obtenerHistorialTransacciones();
  const nuevaTransaccion = {
    id: generarId(),
    tipo: "RETIRO",
    concepto: `Retiro a ${entidadFinanciera} (${numeroCuenta.slice(-4).padStart(numeroCuenta.length, '*')})`,
    monto,
    fecha: new Date().toISOString().split("T")[0],
    estado: "COMPLETADO",
    destino: entidadFinanciera,
  };
  historial.unshift(nuevaTransaccion);
  localStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(historial));

  /** Simula procesamiento asíncrono */
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    solicitudId: `retiro-${Date.now()}`,
    estado: "COMPLETADO",
    mensaje: "Retiro procesado exitosamente",
    transaccion: nuevaTransaccion,
  };
};

/**
 * Procesa una reserva de alquiler por horas
 * Descuenta el monto del saldo disponible y registra la transacción
 */
export const solicitarReserva = async (datosReserva) => {
  const { articuloId, articuloNombre, horaInicio, horaFin, horas, tarifaHora, total, pin } = datosReserva;

  if (!articuloId || !total) {
    throw new Error("Datos de reserva incompletos");
  }

  const balance = await obtenerBalance();

  if (total > balance.saldoDisponible) {
    throw new Error(`Saldo insuficiente. Disponible: ${balance.saldoDisponible.toLocaleString()} COP`);
  }

  /** Actualiza balance */
  const nuevoBalance = {
    ...balance,
    saldoDisponible: balance.saldoDisponible - total,
    retirosProceso: balance.retirosProceso + 1,
  };
  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(nuevoBalance));

  /** Agrega transacción al historial */
  const historial = await obtenerHistorialTransacciones();
  const nuevaTransaccion = {
    id: generarId(),
    tipo: "RETIRO",
    concepto: `Reserva: ${articuloNombre} (${horas}h)`,
    monto: total,
    fecha: new Date().toISOString().split("T")[0],
    estado: "COMPLETADO",
    destino: "Reserva de alquiler",
  };
  historial.unshift(nuevaTransaccion);
  localStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(historial));

  /** Simula procesamiento asíncrono */
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    reservaId: `res_${Date.now()}`,
    estado: "CONFIRMADA",
    mensaje: "Reserva procesada exitosamente",
    transaccion: nuevaTransaccion,
  };
};

/** Agrega un ingreso al historial y actualiza balance (para testing/integración) */
export const agregarIngreso = async (concepto, monto) => {
  const balance = await obtenerBalance();
  const nuevoBalance = {
    ...balance,
    saldoDisponible: balance.saldoDisponible + monto,
    totalGanado: balance.totalGanado + monto,
  };
  localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(nuevoBalance));

  const historial = await obtenerHistorialTransacciones();
  const nuevaTransaccion = {
    id: generarId(),
    tipo: "INGRESO",
    concepto,
    monto,
    fecha: new Date().toISOString().split("T")[0],
    estado: "COMPLETADO",
    destino: "Billetera UniTrade",
  };
  historial.unshift(nuevaTransaccion);
  localStorage.setItem(STORAGE_KEYS.HISTORIAL, JSON.stringify(historial));

  return nuevoBalance;
};

export default {
  obtenerBalance,
  obtenerHistorialTransacciones,
  solicitarRetiro,
  solicitarReserva,
  listarEntidades,
  agregarIngreso,
};