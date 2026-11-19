/**
 * @file seed-demo-fotos.ts
 * Seed idempotente que deja exactamente 19 artículos universitarios únicos en
 * la base de datos de Neon (uno por cada imagen local en frontend/public/articulos/).
 *
 * - Elimina artículos duplicados por título normalizado O por ruta de imagen
 *   (salvo los que tengan alquileres vinculados, para no romper integridad).
 * - Borra artículos de prueba previos del seed cuyos títulos estén en la lista maestra.
 * - Crea exactamente 19 artículos, distribuidos linealmente entre usuarios (índice 0-18,
 *   se detiene en el ítem 19, no recicla).
 * - Imprime la lista final para confirmar cero títulos y cero fotos repetidas.
 *
 * Requisitos: DATABASE_URL en backend/.env (Neon).
 *
 * Uso:
 *   npx tsx prisma/seed-demo-fotos.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { CondicionArticulo } from "../src/generated/prisma/enums.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en backend/.env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});

const AHORA = new Date();
const UN_ANIO_DESDE = new Date(AHORA.getTime() + 365 * 24 * 60 * 60 * 1000);

// ---------------------------------------------------------------
// Disponibilidad semanal por defecto (todos los días, 06:00–22:00).
// ---------------------------------------------------------------
const DIAS_DISPONIBILIDAD = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

const disponibilidadPorDefecto = () => {
  const disponibilidad: Record<string, { activo: boolean; inicio: string; fin: string }> = {};
  for (const dia of DIAS_DISPONIBILIDAD) {
    disponibilidad[dia] = { activo: true, inicio: "06:00", fin: "22:00" };
  }
  return disponibilidad;
};

const SALDO_MINIMO_COP = 50_000;

/**
 * Asegura que todos los usuarios existentes tengan:
 * 1. Franjas de disponibilidad semanal configuradas (si no las tienen).
 * 2. Saldo mínimo de $50.000 COP en su billetera.
 */
async function sembrarDisponibilidadYSaldos(usuarios: Array<{ id: string; nombre: string; correo: string }>) {
  console.log("\n🕒 Configurando disponibilidad y saldos mínimos...\n");

  for (const usuario of usuarios) {
    // 1. Disponibilidad: solo si no tiene ninguna configurada o está vacía.
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: { disponibilidad: true },
    });

    const tieneDisponibilidad = usuarioActual?.disponibilidad
      ? Object.values(usuarioActual.disponibilidad as Record<string, unknown>).some(
          (v) =>
            v &&
            typeof v === "object" &&
            !Array.isArray(v) &&
            (v as { activo?: unknown }).activo === true,
        )
      : false;

    if (!tieneDisponibilidad) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { disponibilidad: disponibilidadPorDefecto() },
      });
      console.log(`   📅 Disponibilidad configurada para ${usuario.correo}`);
    }

    // 2. Billetera: asegurar saldo mínimo.
    await prisma.billetera.upsert({
      where: { usuarioId: usuario.id },
      create: {
        usuarioId: usuario.id,
        saldoDisponible: SALDO_MINIMO_COP,
        saldoPendiente: 0,
        totalGanado: SALDO_MINIMO_COP,
        totalRetirado: 0,
        moneda: "COP",
      },
      update: {},
    });

    // Re-leer y ajustar si es necesario (Prisma no soporta max() nativo en update).
    const billetera = await prisma.billetera.findUnique({
      where: { usuarioId: usuario.id },
      select: { saldoDisponible: true },
    });
    if (billetera && billetera.saldoDisponible < SALDO_MINIMO_COP) {
      await prisma.billetera.update({
        where: { usuarioId: usuario.id },
        data: { saldoDisponible: SALDO_MINIMO_COP },
      });
      console.log(`   💰 Saldo ajustado a $${SALDO_MINIMO_COP.toLocaleString("es-CO")} para ${usuario.correo}`);
    } else if (billetera) {
      console.log(`   💰 Saldo OK: $${billetera.saldoDisponible.toLocaleString("es-CO")} para ${usuario.correo}`);
    }
  }
}

// ---------------------------------------------------------------
// 19 artículos universitarios únicos (título + imagen local 1:1).
// ---------------------------------------------------------------
type ArticuloDemo = {
  titulo: string;
  categoria: string;
  descripcion: string;
  condicion: CondicionArticulo;
  tarifaHora: number;
  imagen: string;
};

const ARTICULOS_UNICOS: ArticuloDemo[] = [
  {
    titulo: "Bata blanca de laboratorio talla M",
    categoria: "Laboratorio",
    descripcion:
      "Bata blanca de algodón para prácticas de laboratorio, talla M, en buen estado. Ideal para cursos de química y biología.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: "/articulos/bata-laboratorio.jpg",
  },
  {
    titulo: "Calculadora científica Casio fx-991LA X",
    categoria: "Calculadoras",
    descripcion:
      "Calculadora científica Casio fx-991LA con pantalla ClassWiz, ideal para matemáticas, física e ingeniería.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 1800,
    imagen: "/articulos/calculadora-casio.jpg",
  },
  {
    titulo: "Calculadora graficadora Texas Instruments TI-84",
    categoria: "Calculadoras",
    descripcion:
      "Calculadora graficadora TI-84 Plus, ampliamente usada en cursos de cálculo, estadística e ingeniería. Incluye cable de conexión.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 3500,
    imagen: "/articulos/calculadora-graficadora.jpg",
  },
  {
    titulo: "Libro Cálculo de una Variable - James Stewart",
    categoria: "Libros",
    descripcion:
      "Libro de cálculo diferencial e integral de James Stewart, ideal para estudiantes de ingeniería y ciencias. Estado muy bueno, sin subrayados importantes.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 2500,
    imagen: "/articulos/libro-calculo.jpg",
  },
  {
    titulo: "Libro Física Universitaria - Sears Zemansky",
    categoria: "Libros",
    descripcion:
      "Texto clásico de física universitaria (mecánica, termodinámica, electricidad y magnetismo). Útil para cursos básicos de física.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2000,
    imagen: "/articulos/libro-fisica.jpg",
  },
  {
    titulo: "Libro Clean Code - Ingeniería de Software",
    categoria: "Libros",
    descripcion:
      "Referencia esencial para estudiantes de programación y desarrollo de software. Ejercicios y buenas prácticas de código.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 2800,
    imagen: "/articulos/libro-programacion.jpg",
  },
  {
    titulo: "Multímetro digital autorrango con puntas",
    categoria: "Laboratorio",
    descripcion:
      "Multímetro digital profesional para medición de voltaje, corriente y resistencia. Incluye cables de prueba.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 4500,
    imagen: "/articulos/multimetro-digital.jpg",
  },
  {
    titulo: "Kit Arduino Uno R3 con protoboard y sensores",
    categoria: "Laboratorio",
    descripcion:
      "Kit de electrónica para prototipado: placa Arduino Uno, protoboard, sensores de temperatura, luz y movimiento, jumpers y resistencias.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 6000,
    imagen: "/articulos/kit-arduino.jpg",
  },
  {
    titulo: "Gafas de seguridad transparentes para laboratorio",
    categoria: "Laboratorio",
    descripcion:
      "Gafas de protección con certificación para laboratorio. Lentes transparentes, montura ajustable y tratamiento antivaho.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 1200,
    imagen: "/articulos/gafas-seguridad.jpg",
  },
  {
    titulo: "Adaptador multipuerto USB-C a HDMI y USB 3.0",
    categoria: "Tecnología",
    descripcion:
      "Hub multipuerto con HDMI, USB-A y USB-C para conectar monitores y periféricos a laptops modernas.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2500,
    imagen: "/articulos/adaptador-usbc.jpg",
  },
  {
    titulo: "Cargador rápido USB-C 65W para portátil",
    categoria: "Tecnología",
    descripcion:
      "Cargador rápido USB-C de 65W compatible con la mayoría de portátiles. Incluye cable desmontable.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 3200,
    imagen: "/articulos/cargador-laptop.jpg",
  },
  {
    titulo: "Tableta gráfica digitalizadora con lápiz óptico",
    categoria: "Tecnología",
    descripcion:
      "Tableta gráfica Wacom Intuos para diseño digital e ilustración. Incluye stylus sensible a la presión.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 5500,
    imagen: "/articulos/tableta-grafica.jpg",
  },
  {
    titulo: "Audífonos inalámbricos de diadema con aislamiento",
    categoria: "Tecnología",
    descripcion:
      "Audífonos over-ear con cancelación activa de ruido, ideales para estudiar y concentrarse en bibliotecas o espacios compartidos.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 4000,
    imagen: "/articulos/audifonos.jpg",
  },
  {
    titulo: "Balón de fútbol profesional N.º 5",
    categoria: "Deportes",
    descripcion:
      "Balón de fútbol talla 5, marca Golty, para juegos recreativos y entrenamientos universitarios.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: "/articulos/balon-futbol.jpg",
  },
  {
    titulo: "Balón de baloncesto N.º 7 agarre antideslizante",
    categoria: "Deportes",
    descripcion:
      "Balón de baloncesto Spalding oficial, tamaño 7, para canchas techadas y al aire libre.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 2000,
    imagen: "/articulos/balon-baloncesto.jpg",
  },
  {
    titulo: "Raqueta de tenis de grafito con funda",
    categoria: "Deportes",
    descripcion:
      "Raqueta de tenis Wilson para iniciación e intermedio. Empuñadura cómoda y cordaje en buen estado.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2200,
    imagen: "/articulos/raqueta-tenis.jpg",
  },
  {
    titulo: "Atril metálico plegable para lectura y partituras",
    categoria: "Otros",
    descripcion:
      "Atril metálico plegable para sostener libros y partituras mientras estudias. Ajustable en altura y ángulo.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 1200,
    imagen: "/articulos/atril-lectura.jpg",
  },
  {
    titulo: "Juego de escuadras y regla T para dibujo técnico",
    categoria: "Otros",
    descripcion:
      "Juego de dibujo técnico con regla T, escuadras 45° y 60°, y cartabón. Ideal para estudiantes de arquitectura e ingeniería.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: "/articulos/regla-dibujo.jpg",
  },
  {
    titulo: "Trípode ajustable para celular y cámara",
    categoria: "Otros",
    descripcion:
      "Trípode compacto y ligero compatible con celulares y cámaras pequeñas. Ideal para grabaciones y videollamadas estable.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 1800,
    imagen: "/articulos/tripode.jpg",
  },
];

const TITULOS_MAESTROS = new Set(ARTICULOS_UNICOS.map((a) => a.titulo.toLowerCase().trim()));

function normalizar(texto: string): string {
  return texto.toLowerCase().trim().replace(/\s+/g, " ");
}

async function main() {
  console.log("🚀 Iniciando seed de 19 artículos únicos...\n");

  // 1. Usuarios existentes.
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, correo: true },
    orderBy: { creadoEn: "asc" },
  });

  if (usuarios.length === 0) {
    console.log("⚠️  No hay usuarios en la base de datos. No se crearán artículos.");
    await prisma.$disconnect();
    return;
  }

  console.log(`👥 Usuarios encontrados: ${usuarios.length}`);
  usuarios.forEach((u) => console.log(`   - ${u.correo} (${u.nombre})`));

  // 1b. Disponibilidad y saldos mínimos para todos los usuarios.
  await sembrarDisponibilidadYSaldos(usuarios);

  // 2. Consultar TODOS los artículos existentes ordenados por creadoEn.
  const todosArticulos = await prisma.articulo.findMany({
    select: {
      id: true,
      titulo: true,
      categoria: true,
      imagenes: true,
      propietarioId: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  console.log(`\n📦 Artículos existentes en BD: ${todosArticulos.length}`);

  // Obtener alquileres para proteger integridad referencial en la limpieza.
  const alquileres = await prisma.alquiler.findMany({
    select: { articuloId: true },
  });
  const articulosConAlquileres = new Set(alquileres.map((a) => a.articuloId));

  // 2. Limpieza inicial: eliminar artículos que NO estén en la lista maestra
  //    de los 19 títulos únicos (incluyendo los 9 artículos viejos de prueba),
  //    siempre que no tengan alquileres vinculados. Si los tienen, se eliminan
  //    los alquileres de prueba primero y luego el artículo.
  const idsAborrarLimpieza = new Set<string>();

  for (const art of todosArticulos) {
    const tituloNorm = normalizar(art.titulo);
    const esMaestro = TITULOS_MAESTROS.has(tituloNorm);

    if (!esMaestro) {
      // Título no está en la lista maestra: candidato a eliminación total.
      if (!articulosConAlquileres.has(art.id)) {
        idsAborrarLimpieza.add(art.id);
      } else {
        // Tiene alquileres vinculados: eliminar los alquileres de prueba y luego el artículo.
        idsAborrarLimpieza.add(art.id);
      }
    }
  }

  // 2a. Eliminar alquileres vinculados a artículos que no son de la lista maestra.
  let alquileresBorrados = 0;
  for (const id of idsAborrarLimpieza) {
    try {
      const resultado = await prisma.alquiler.deleteMany({
        where: { articuloId: id },
      });
      alquileresBorrados += resultado.count;
    } catch {
      // Si falla, se ignora y se intenta borrar el artículo de todas formas.
    }
  }

  // 2b. Eliminar los artículos no maestros (ya sin alquileres vinculados).
  let borradosLimpieza = 0;
  for (const id of idsAborrarLimpieza) {
    try {
      await prisma.articulo.delete({ where: { id } });
      borradosLimpieza++;
    } catch {
      // Si falla por FK restante, saltar.
    }
  }
  console.log(
    `🗑️  Limpieza inicial: ${borradosLimpieza} artículos no-maestros borrados, ${alquileresBorrados} alquileres de prueba eliminados.`
  );

  // 2c. Volver a consultar artículos restantes para el manejo de duplicados.
  const todosArticulosRestantes = await prisma.articulo.findMany({
    select: {
      id: true,
      titulo: true,
      categoria: true,
      imagenes: true,
      propietarioId: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  // 2d. Detectar alquileres vinculados a los artículos restantes.
  const alquileresRestantes = await prisma.alquiler.findMany({
    select: { articuloId: true },
  });
  const articulosConAlquileresRestantes = new Set(
    alquileresRestantes.map((a) => a.articuloId)
  );

  // 2e. Agrupar por título normalizado y por imagen.
  const porTitulo = new Map<string, string[]>();
  const porImagen = new Map<string, string[]>();
  const idsABorrarDuplicados = new Set<string>();

  for (const art of todosArticulosRestantes) {
    const tituloNorm = normalizar(art.titulo);
    const imagen =
      Array.isArray(art.imagenes) && art.imagenes.length > 0
        ? art.imagenes[0]
        : "";

    // Solo agrupar duplicados entre artículos de la lista maestra.
    if (TITULOS_MAESTROS.has(tituloNorm)) {
      if (!porTitulo.has(tituloNorm)) porTitulo.set(tituloNorm, []);
      porTitulo.get(tituloNorm)!.push(art.id);
    }

    if (imagen) {
      if (!porImagen.has(imagen)) porImagen.set(imagen, []);
      porImagen.get(imagen)!.push(art.id);
    }
  }

  // 2f. Marcar duplicados por título (mantener el primero creado, borrar el resto).
  for (const [, ids] of porTitulo) {
    if (ids.length > 1) {
      for (let i = 1; i < ids.length; i++) {
        if (!articulosConAlquileresRestantes.has(ids[i])) {
          idsABorrarDuplicados.add(ids[i]);
        }
      }
    }
  }

  // 2g. Marcar duplicados por imagen (mantener el primero, borrar el resto sin alquileres).
  for (const [, ids] of porImagen) {
    if (ids.length > 1) {
      for (let i = 1; i < ids.length; i++) {
        if (!articulosConAlquileresRestantes.has(ids[i])) {
          idsABorrarDuplicados.add(ids[i]);
        }
      }
    }
  }

  // 2h. Ejecutar borrados de duplicados (respetando integridad referencial).
  let borradosDuplicados = 0;
  for (const id of idsABorrarDuplicados) {
    if (articulosConAlquileresRestantes.has(id)) continue;
    try {
      await prisma.articulo.delete({ where: { id } });
      borradosDuplicados++;
    } catch {
      // Si falla por FK, saltar.
    }
  }
  console.log(
    `🗑️  Duplicados borrados: ${borradosDuplicados} (título o imagen repetidos).`
  );

  // 3. Crear exactamente 19 artículos únicos, distribuidos linealmente entre usuarios.
  let totalCreados = 0;
  const resumen: Array<{ titulo: string; propietario: string; imagen: string }> = [];

  for (let i = 0; i < ARTICULOS_UNICOS.length; i++) {
    const demo = ARTICULOS_UNICOS[i];
    const propietario = usuarios[i % usuarios.length];

    // Verificar que no exista ya este título exacto para este usuario (idempotencia parcial).
    const yaExiste = await prisma.articulo.findFirst({
      where: {
        propietarioId: propietario.id,
        titulo: demo.titulo,
      },
    });

    if (yaExiste) {
      // Actualizar con la imagen local correcta si no coincide.
      await prisma.articulo.update({
        where: { id: yaExiste.id },
        data: { imagenes: [demo.imagen] },
      });
      resumen.push({ titulo: demo.titulo, propietario: propietario.correo, imagen: demo.imagen });
      console.log(`   ♻️  Actualizado: "${demo.titulo}" → ${propietario.correo}`);
      continue;
    }

    const creado = await prisma.articulo.create({
      data: {
        titulo: demo.titulo,
        descripcion: demo.descripcion,
        categoria: demo.categoria,
        condicion: demo.condicion,
        tarifaHora: demo.tarifaHora,
        tarifaSugerida: demo.tarifaHora,
        ubicacion: "Campus principal - Biblioteca",
        imagenes: [demo.imagen],
        disponibleDesde: AHORA,
        disponibleHasta: UN_ANIO_DESDE,
        activo: true,
        propietarioId: propietario.id,
      },
    });

    totalCreados++;
    resumen.push({ titulo: demo.titulo, propietario: propietario.correo, imagen: demo.imagen });
    console.log(
      `   ✨ Creado (${i + 1}/19): "${creado.titulo}" → ${propietario.correo} (${demo.imagen})`
    );
  }

  // 4. Verificación final: listar todos los artículos y confirmar cero duplicados.
  const finales = await prisma.articulo.findMany({
    select: { id: true, titulo: true, imagenes: true, propietario: { select: { correo: true } } },
    orderBy: { creadoEn: "asc" },
  });

  const titulosFinales = finales.map((a) => normalizar(a.titulo));
  const imagenesFinales = finales.map((a) => (Array.isArray(a.imagenes) && a.imagenes.length > 0 ? a.imagenes[0] : ""));
  const titulosDuplicados = titulosFinales.filter((t, i) => titulosFinales.indexOf(t) !== i);
  const imagenesDuplicadas = imagenesFinales.filter((img, i) => imagenesFinales.indexOf(img) !== i);

  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN FINAL");
  console.log("────────────────────────────────────────────");
  console.log(`Total artículos en BD: ${finales.length}`);
  console.log(`Artículos creados en esta ejecución: ${totalCreados}`);
  console.log(`Títulos duplicados detectados: ${titulosDuplicados.length}`);
  console.log(`Imágenes duplicadas detectadas: ${imagenesDuplicadas.length}`);

  if (titulosDuplicados.length > 0 || imagenesDuplicadas.length > 0) {
    console.error("❌ ADVERTENCIA: Se detectaron duplicados.");
    if (titulosDuplicados.length > 0) console.error("   Títulos:", [...new Set(titulosDuplicados)]);
    if (imagenesDuplicadas.length > 0) console.error("   Imágenes:", [...new Set(imagenesDuplicadas)]);
    process.exitCode = 1;
  } else {
    console.log("✅ Cero títulos y cero fotos repetidas.");
  }

  console.log("\n📋 Lista exacta de artículos en la base de datos:");
  for (const a of finales) {
    const imagen = Array.isArray(a.imagenes) && a.imagenes.length > 0 ? a.imagenes[0] : "(sin imagen)";
    console.log(`   - id=${a.id} | titulo="${a.titulo}" | propietario=${a.propietario.correo} | imagen=${imagen}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error ejecutando el seed:", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect().catch(() => {});
});
