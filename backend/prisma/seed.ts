/**
 * Seed de demostración de UniTrade.
 *
 * Crea usuarios, billeteras y movimientos de ejemplo para probar HU-10
 * (billetera + retiro). Los artículos y reservas demo ya no se siembran.
 *
 * Es idempotente: usa ids fijos y `upsert`, así que se puede ejecutar varias
 * veces. No borra datos existentes ni reinicia billeteras ya creadas.
 *
 * Por defecto NO se ejecuta: solo crea datos si defines SEED_DEMO=true.
 * Estos usuarios son ficticios y no deben mezclarse con usuarios reales.
 *
 * Uso: SEED_DEMO=true npm run prisma:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
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

const IDS = {
  usuarios: {
    admin: 'seed-usuario-admin',
    laura: 'seed-usuario-laura',
    carlos: 'seed-usuario-carlos',
    ana: 'seed-usuario-ana',
    diego: 'seed-usuario-diego',
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
      descripcion: 'Ingreso por alquiler',
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
      descripcion: 'Ingreso por alquiler',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: {
        origen: 'seed',
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
      descripcion: 'Ingreso por alquiler',
      estado: EstadoTransaccion.COMPLETADO,
      metadata: {
        origen: 'seed',
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
  await sembrarBilleteras();
  await sembrarRetirosYTransacciones();

  const [usuarios, billeteras, transacciones, retiros] = await Promise.all([
    prisma.usuario.count(),
    prisma.billetera.count(),
    prisma.transaccionBilletera.count(),
    prisma.retiro.count(),
  ]);

  console.log('\nSeed completado:');
  console.log(`  Usuarios: ${usuarios} | Billeteras: ${billeteras} | Transacciones: ${transacciones} | Retiros: ${retiros}`);
  console.log('\nCuentas de prueba (contraseña: UniTrade2026*):');
  console.log('  admin@unisimon.edu.co          → ADMIN');
  console.log('  laura.gomez@unisimon.edu.co    → propietaria (billetera con saldo)');
  console.log('  carlos.ruiz@unisimon.edu.co    → propietario (retiro pendiente)');
  console.log('  ana.martinez@unisimon.edu.co   → arrendataria');
  console.log('  diego.perez@unisimon.edu.co    → arrendatario');
}

const habilitarDemo = process.env.SEED_DEMO === 'true';

if (!habilitarDemo) {
  console.log(
    'Seed de demostración omitido: no se crean usuarios ni billeteras falsas.\n' +
      'Si necesitas los datos de prueba para la billetera y los retiros, ejecuta con SEED_DEMO=true.',
  );
  await prisma.$disconnect();
} else {
  principal()
    .catch((error) => {
      console.error('Error al sembrar la base de datos:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
