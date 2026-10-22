/**
 * Seed de demostración de UniTrade.
 *
 * Crea usuarios, artículos, reservas, pagos y billeteras de ejemplo para
 * probar HU-06 (pago + comisión) y HU-10 (billetera + retiro).
 *
 * Es idempotente: usa ids fijos y `upsert`, así que se puede ejecutar varias
 * veces. No borra datos existentes ni reinicia billeteras ya creadas.
 *
 * Uso: npm run prisma:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { calcularDesglose } from '../src/comun/dinero.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  CondicionArticulo,
  EstadoAlquiler,
  EstadoPago,
  EstadoTransaccion,
  MetodoRetiro,
  Rol,
  TipoTransaccion,
} from '../src/generated/prisma/enums.js';

const cadenaConexion = process.env.DATABASE_URL;
if (!cadenaConexion) {
  throw new Error('DATABASE_URL no está definida. Revisa backend/.env');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: cadenaConexion }),
});

const CLAVE_DEMO = 'UniTrade2026*';
const ahora = Date.now();
const dias = (cantidad: number) => new Date(ahora + cantidad * 24 * 60 * 60 * 1000);
const horas = (cantidad: number) => new Date(ahora + cantidad * 60 * 60 * 1000);

const IDS = {
  usuarios: {
    admin: 'seed-usuario-admin',
    laura: 'seed-usuario-laura',
    carlos: 'seed-usuario-carlos',
    ana: 'seed-usuario-ana',
    diego: 'seed-usuario-diego',
  },
  articulos: {
    mesa: 'seed-articulo-mesa',
    calculadora: 'seed-articulo-calculadora',
    silla: 'seed-articulo-silla',
    graficadora: 'seed-articulo-graficadora',
  },
  alquileres: {
    pagadoLaura: 'seed-alquiler-ana-mesa',
    pendienteDiego: 'seed-alquiler-diego-silla',
    activoAna: 'seed-alquiler-ana-graficadora',
  },
  pagos: {
    mesa: 'seed-pago-mesa',
    graficadora: 'seed-pago-graficadora',
  },
  billeteras: {
    laura: 'seed-billetera-laura',
    carlos: 'seed-billetera-carlos',
  },
  retiros: {
    laura: 'seed-retiro-laura',
    carlos: 'seed-retiro-carlos',
  },
  transacciones: {
    lauraIngresoViejo: 'seed-tx-laura-ingreso-viejo',
    lauraRetiro: 'seed-tx-laura-retiro',
    lauraIngresoMesa: 'seed-tx-laura-ingreso-mesa',
    carlosIngresoGraficadora: 'seed-tx-carlos-ingreso-graficadora',
    carlosRetiroPendiente: 'seed-tx-carlos-retiro-pendiente',
  },
} as const;

async function sembrarUsuarios(hashContrasena: string) {
  const usuarios = [
    {
      id: IDS.usuarios.admin,
      nombre: 'Administrador UniTrade',
      correo: 'admin@unisimon.edu.co',
      telefono: '3000000001',
      rol: Rol.ADMIN,
      sede: 'Barranquilla',
    },
    {
      id: IDS.usuarios.laura,
      nombre: 'Laura Gómez',
      correo: 'laura.gomez@unisimon.edu.co',
      telefono: '3001112233',
      rol: Rol.ESTUDIANTE,
      sede: 'Barranquilla',
    },
    {
      id: IDS.usuarios.carlos,
      nombre: 'Carlos Ruiz',
      correo: 'carlos.ruiz@unisimon.edu.co',
      telefono: '3002223344',
      rol: Rol.ESTUDIANTE,
      sede: 'Barranquilla',
    },
    {
      id: IDS.usuarios.ana,
      nombre: 'Ana Martínez',
      correo: 'ana.martinez@unisimon.edu.co',
      telefono: '3003334455',
      rol: Rol.ESTUDIANTE,
      sede: 'Barranquilla',
    },
    {
      id: IDS.usuarios.diego,
      nombre: 'Diego Pérez',
      correo: 'diego.perez@unisimon.edu.co',
      telefono: '3004445566',
      rol: Rol.ESTUDIANTE,
      sede: 'Barranquilla',
    },
  ];

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { correo: usuario.correo },
      create: {
        ...usuario,
        hashContrasena,
        telefonoVerificado: true,
        fechaVerificacionTelefono: dias(-40),
        puntoEntrega: 'Campus principal - Biblioteca',
      },
      update: {
        nombre: usuario.nombre,
        hashContrasena,
        telefono: usuario.telefono,
        rol: usuario.rol,
        sede: usuario.sede,
        telefonoVerificado: true,
      },
    });
  }
}

async function sembrarArticulos() {
  const articulos = [
    {
      id: IDS.articulos.mesa,
      propietarioId: IDS.usuarios.laura,
      titulo: 'Mesa de estudio plegable',
      descripcion:
        'Mesa portátil para estudiar en biblioteca o sala de estudio. Incluye superficie amplia y patas ajustables.',
      categoria: 'Estudio',
      condicion: CondicionArticulo.BUENO,
      tarifaHora: 15_000,
      tarifaSugerida: 12_000,
      ubicacion: 'Biblioteca central - Campus Barranquilla',
      imagenes: ['https://picsum.photos/seed/unitrade-mesa/800/600'],
      disponibleDesde: dias(-30),
      disponibleHasta: dias(120),
    },
    {
      id: IDS.articulos.calculadora,
      propietarioId: IDS.usuarios.laura,
      titulo: 'Calculadora Casio fx-991',
      descripcion:
        'Calculadora científica permitida en exámenes. Funciona con batería y celda solar.',
      categoria: 'Herramientas',
      condicion: CondicionArticulo.COMO_NUEVO,
      tarifaHora: 5_000,
      tarifaSugerida: 4_000,
      ubicacion: 'Bloque A - Campus Barranquilla',
      imagenes: ['https://picsum.photos/seed/unitrade-calculadora/800/600'],
      disponibleDesde: dias(-30),
      disponibleHasta: dias(120),
    },
    {
      id: IDS.articulos.silla,
      propietarioId: IDS.usuarios.carlos,
      titulo: 'Silla ergonómica',
      descripcion:
        'Silla con soporte lumbar y altura ajustable, ideal para jornadas largas de estudio.',
      categoria: 'Mobiliario',
      condicion: CondicionArticulo.BUENO,
      tarifaHora: 8_000,
      tarifaSugerida: 6_500,
      ubicacion: 'Bloque B - Campus Barranquilla',
      imagenes: ['https://picsum.photos/seed/unitrade-silla/800/600'],
      disponibleDesde: dias(-30),
      disponibleHasta: dias(120),
    },
    {
      id: IDS.articulos.graficadora,
      propietarioId: IDS.usuarios.carlos,
      titulo: 'Calculadora graficadora HP Prime',
      descripcion:
        'Calculadora graficadora para cálculo, álgebra y estadística. Incluye funda y cable de carga.',
      categoria: 'Herramientas',
      condicion: CondicionArticulo.NUEVO,
      tarifaHora: 12_000,
      tarifaSugerida: 10_000,
      ubicacion: 'Bloque C - Campus Barranquilla',
      imagenes: ['https://picsum.photos/seed/unitrade-graficadora/800/600'],
      disponibleDesde: dias(-30),
      disponibleHasta: dias(120),
    },
  ];

  for (const articulo of articulos) {
    await prisma.articulo.upsert({
      where: { id: articulo.id },
      create: { ...articulo, activo: true },
      update: { ...articulo, activo: true },
    });
  }
}

async function sembrarBilleteras() {
  const billeteras = [
    {
      id: IDS.billeteras.laura,
      usuarioId: IDS.usuarios.laura,
      saldoDisponible: 62_800,
      saldoPendiente: 0,
      totalGanado: 82_800,
      totalRetirado: 20_000,
    },
    {
      id: IDS.billeteras.carlos,
      usuarioId: IDS.usuarios.carlos,
      saldoDisponible: 16_120,
      saldoPendiente: 5_000,
      totalGanado: 21_120,
      totalRetirado: 0,
    },
  ];

  for (const billetera of billeteras) {
    await prisma.billetera.upsert({
      where: { usuarioId: billetera.usuarioId },
      create: { ...billetera, moneda: 'COP' },
      // No se reinician saldos si la billetera ya existe.
      update: {},
    });
  }
}

async function sembrarReservasYPagos() {
  const desgloseMesa = calcularDesglose(4 * 15_000); // 60.000 → comisión 7.200
  const desgloseSilla = calcularDesglose(3 * 8_000); // 24.000 → comisión 2.880
  const desgloseGraficadora = calcularDesglose(2 * 12_000); // 24.000 → comisión 2.880

  const alquileres = [
    {
      id: IDS.alquileres.pagadoLaura,
      articuloId: IDS.articulos.mesa,
      arrendatarioId: IDS.usuarios.ana,
      propietarioId: IDS.usuarios.laura,
      inicio: dias(-6),
      fin: dias(-5),
      horas: 4,
      subtotal: desgloseMesa.subtotal,
      comision: desgloseMesa.comision,
      total: desgloseMesa.total,
      estado: EstadoAlquiler.COMPLETADO,
      codigoVerificacion: '4821',
    },
    {
      id: IDS.alquileres.pendienteDiego,
      articuloId: IDS.articulos.silla,
      arrendatarioId: IDS.usuarios.diego,
      propietarioId: IDS.usuarios.carlos,
      inicio: horas(24),
      fin: horas(27),
      horas: 3,
      subtotal: desgloseSilla.subtotal,
      comision: desgloseSilla.comision,
      total: desgloseSilla.total,
      estado: EstadoAlquiler.PENDIENTE_ENTREGA,
      codigoVerificacion: null,
    },
    {
      id: IDS.alquileres.activoAna,
      articuloId: IDS.articulos.graficadora,
      arrendatarioId: IDS.usuarios.ana,
      propietarioId: IDS.usuarios.carlos,
      inicio: dias(-1),
      fin: dias(1),
      horas: 2,
      subtotal: desgloseGraficadora.subtotal,
      comision: desgloseGraficadora.comision,
      total: desgloseGraficadora.total,
      estado: EstadoAlquiler.ACTIVO,
      codigoVerificacion: '7392',
    },
  ];

  for (const alquiler of alquileres) {
    await prisma.alquiler.upsert({
      where: { id: alquiler.id },
      create: alquiler,
      update: alquiler,
    });
  }

  await prisma.pago.upsert({
    where: { alquilerId: IDS.alquileres.pagadoLaura },
    create: {
      id: IDS.pagos.mesa,
      alquilerId: IDS.alquileres.pagadoLaura,
      monto: desgloseMesa.total,
      comision: desgloseMesa.comision,
      montoPropietario: desgloseMesa.montoPropietario,
      moneda: 'COP',
      estado: EstadoPago.COMPLETADO,
      metodo: 'sandbox',
      idTransaccion: 'sbx_tx_seed_mesa',
      pagadoEn: dias(-5),
      metadata: { pasarela: 'sandbox', origen: 'seed' },
    },
    update: {
      monto: desgloseMesa.total,
      comision: desgloseMesa.comision,
      montoPropietario: desgloseMesa.montoPropietario,
      estado: EstadoPago.COMPLETADO,
      pagadoEn: dias(-5),
    },
  });

  await prisma.pago.upsert({
    where: { alquilerId: IDS.alquileres.activoAna },
    create: {
      id: IDS.pagos.graficadora,
      alquilerId: IDS.alquileres.activoAna,
      monto: desgloseGraficadora.total,
      comision: desgloseGraficadora.comision,
      montoPropietario: desgloseGraficadora.montoPropietario,
      moneda: 'COP',
      estado: EstadoPago.COMPLETADO,
      metodo: 'sandbox',
      idTransaccion: 'sbx_tx_seed_graficadora',
      pagadoEn: dias(-2),
      metadata: { pasarela: 'sandbox', origen: 'seed' },
    },
    update: {
      monto: desgloseGraficadora.total,
      comision: desgloseGraficadora.comision,
      montoPropietario: desgloseGraficadora.montoPropietario,
      estado: EstadoPago.COMPLETADO,
      pagadoEn: dias(-2),
    },
  });
}

async function sembrarRetirosYTransacciones() {
  const laura = await prisma.billetera.findUniqueOrThrow({
    where: { usuarioId: IDS.usuarios.laura },
  });
  const carlos = await prisma.billetera.findUniqueOrThrow({
    where: { usuarioId: IDS.usuarios.carlos },
  });

  await prisma.retiro.upsert({
    where: { id: IDS.retiros.laura },
    create: {
      id: IDS.retiros.laura,
      billeteraId: laura.id,
      metodo: MetodoRetiro.NEQUI,
      cuenta: '3001112233',
      monto: 20_000,
      moneda: 'COP',
      estado: EstadoTransaccion.COMPLETADO,
      idPayout: 'sbx_po_seed_laura',
      completadoEn: dias(-12),
    },
    update: {
      estado: EstadoTransaccion.COMPLETADO,
      idPayout: 'sbx_po_seed_laura',
      completadoEn: dias(-12),
    },
  });

  await prisma.retiro.upsert({
    where: { id: IDS.retiros.carlos },
    create: {
      id: IDS.retiros.carlos,
      billeteraId: carlos.id,
      metodo: MetodoRetiro.NEQUI,
      cuenta: '3002223344',
      monto: 5_000,
      moneda: 'COP',
      estado: EstadoTransaccion.PENDIENTE,
    },
    update: {},
  });

  const transacciones = [
    {
      id: IDS.transacciones.lauraIngresoViejo,
      billeteraId: laura.id,
      tipo: TipoTransaccion.INGRESO,
      monto: 30_000,
      saldoDespues: 30_000,
      descripcion: 'Pago de alquiler: Calculadora Casio fx-991',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: { origen: 'seed', destino: 'Billetera UniTrade' },
      creadoEn: dias(-20),
    },
    {
      id: IDS.transacciones.lauraRetiro,
      billeteraId: laura.id,
      tipo: TipoTransaccion.RETIRO,
      monto: 20_000,
      saldoDespues: 10_000,
      descripcion: 'Retiro a Nequi (****2233)',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: {
        origen: 'seed',
        retiroId: IDS.retiros.laura,
        idPayout: 'sbx_po_seed_laura',
        destino: 'Nequi (****2233)',
      },
      creadoEn: dias(-12),
    },
    {
      id: IDS.transacciones.lauraIngresoMesa,
      billeteraId: laura.id,
      tipo: TipoTransaccion.INGRESO,
      monto: 52_800,
      saldoDespues: 62_800,
      descripcion: 'Pago de alquiler: Mesa de estudio plegable',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: {
        origen: 'seed',
        alquilerId: IDS.alquileres.pagadoLaura,
        pagoId: IDS.pagos.mesa,
        destino: 'Billetera UniTrade',
      },
      creadoEn: dias(-5),
    },
    {
      id: IDS.transacciones.carlosIngresoGraficadora,
      billeteraId: carlos.id,
      tipo: TipoTransaccion.INGRESO,
      monto: 21_120,
      saldoDespues: 21_120,
      descripcion: 'Pago de alquiler: Calculadora graficadora HP Prime',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: {
        origen: 'seed',
        alquilerId: IDS.alquileres.activoAna,
        pagoId: IDS.pagos.graficadora,
        destino: 'Billetera UniTrade',
      },
      creadoEn: dias(-2),
    },
    {
      id: IDS.transacciones.carlosRetiroPendiente,
      billeteraId: carlos.id,
      tipo: TipoTransaccion.RETIRO,
      monto: 5_000,
      saldoDespues: 16_120,
      descripcion: 'Retiro a Nequi (****3344)',
      estado: EstadoTransaccion.PENDIENTE,
      metadata: {
        origen: 'seed',
        retiroId: IDS.retiros.carlos,
        destino: 'Nequi (****3344)',
      },
      creadoEn: dias(-1),
    },
  ];

  for (const transaccion of transacciones) {
    await prisma.transaccionBilletera.upsert({
      where: { id: transaccion.id },
      create: transaccion,
      update: transaccion,
    });
  }
}

async function principal() {
  console.log('Sembrando datos de demostración de UniTrade...');

  const hashContrasena = await hash(CLAVE_DEMO, 10);

  await sembrarUsuarios(hashContrasena);
  await sembrarArticulos();
  await sembrarBilleteras();
  await sembrarReservasYPagos();
  await sembrarRetirosYTransacciones();

  const [usuarios, articulos, alquileres, pagos, billeteras] = await Promise.all([
    prisma.usuario.count(),
    prisma.articulo.count(),
    prisma.alquiler.count(),
    prisma.pago.count(),
    prisma.billetera.count(),
  ]);

  console.log('\nSeed completado:');
  console.log(`  Usuarios: ${usuarios} | Artículos: ${articulos} | Reservas: ${alquileres} | Pagos: ${pagos} | Billeteras: ${billeteras}`);
  console.log('\nCuentas de prueba (contraseña: UniTrade2026*):');
  console.log('  admin@unisimon.edu.co          → ADMIN');
  console.log('  laura.gomez@unisimon.edu.co    → propietaria (billetera con saldo)');
  console.log('  carlos.ruiz@unisimon.edu.co    → propietario (retiro pendiente)');
  console.log('  ana.martinez@unisimon.edu.co   → arrendataria con reserva pagada');
  console.log('  diego.perez@unisimon.edu.co    → arrendatario con pago pendiente');
  console.log('\nIds útiles para probar la API:');
  console.log(`  usuario Ana (paga):        ${IDS.usuarios.ana}`);
  console.log(`  usuario Laura (cobra):     ${IDS.usuarios.laura}`);
  console.log(`  reserva pendiente Diego:   ${IDS.alquileres.pendienteDiego}`);
  console.log(`  artículo silla:            ${IDS.articulos.silla}`);
}

principal()
  .catch((error) => {
    console.error('Error al sembrar la base de datos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
