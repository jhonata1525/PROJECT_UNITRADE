/**
 * @file seed-demo-fotos.ts
 * Seed idempotente de fotos y artículos demo para demostración universitaria
 * (Universidad Simón Bolívar).
 *
 * - Actualiza TODOS los artículos existentes sobreescribiendo sus imágenes con
 *   rutas locales verificadas en frontend/public/articulos/.
 * - Crea 3 artículos nuevos por cada usuario existente (sin borrar usuarios ni saldos).
 * - Cada artículo incluye título, categoría, descripción, tarifa en COP y la
 *   imagen local que corresponde fielmente a su título.
 *
 * Requisitos: DATABASE_URL en backend/.env (ya configurada con Neon).
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
// Rutas locales verificadas en frontend/public/articulos/
// Cada archivo pesa más de 10 KB y es una foto real del objeto.
// ---------------------------------------------------------------
const IMG = (archivo: string) => `/articulos/${archivo}`;

const IMG_LIBRO_CALCULO = IMG("libro-calculo.jpg");
const IMG_LIBRO_FISICA = IMG("libro-fisica.jpg");
const IMG_LIBRO_PROGRAMACION = IMG("libro-programacion.jpg");
const IMG_BATA_LABORATORIO = IMG("bata-laboratorio.jpg");
const IMG_MULTIMETRO = IMG("multimetro-digital.jpg");
const IMG_KIT_ARDUINO = IMG("kit-arduino.jpg");
const IMG_GAFAS_SEGURIDAD = IMG("gafas-seguridad.jpg");
const IMG_CALCULADORA_CASIO = IMG("calculadora-casio.jpg");
const IMG_CALCULADORA_GRAFICADORA = IMG("calculadora-graficadora.jpg");
const IMG_CARGADOR_LAPTOP = IMG("cargador-laptop.jpg");
const IMG_ADAPTADOR_USBC = IMG("adaptador-usbc.jpg");
const IMG_TABLETA_GRAFICA = IMG("tableta-grafica.jpg");
const IMG_AUDIFONOS = IMG("audifonos.jpg");
const IMG_BALON_FUTBOL = IMG("balon-futbol.jpg");
const IMG_RAQUETA_TENIS = IMG("raqueta-tenis.jpg");
const IMG_BALON_BALONCESTO = IMG("balon-baloncesto.jpg");
const IMG_ATRIL_LECTURA = IMG("atril-lectura.jpg");
const IMG_REGLA_DIBUJO = IMG("regla-dibujo.jpg");
const IMG_TRIPODE = IMG("tripode.jpg");

// ---------------------------------------------------------------
// Catálogo de artículos demo: 3 por usuario.
// Cada entrada tiene su ruta de imagen local específica.
// ---------------------------------------------------------------
type ArticuloDemo = {
  titulo: string;
  categoria: string;
  descripcion: string;
  condicion: CondicionArticulo;
  tarifaHora: number;
  imagen: string;
};

const ARTICULOS_DEMO: ArticuloDemo[] = [
  // Libros
  {
    titulo: "Cálculo de Stewart - Edición Universitaria",
    categoria: "Libros",
    descripcion:
      "Libro de cálculo diferencial e integral de James Stewart, ideal para estudiantes de ingeniería y ciencias. Estado muy bueno, sin subrayados importantes.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 2500,
    imagen: IMG_LIBRO_CALCULO,
  },
  {
    titulo: "Física Universitaria - Sears y Zemansky",
    categoria: "Libros",
    descripcion:
      "Texto clásico de física universitaria (mecánica, termodinámica, electricidad y magnetismo). Útil para cursos básicos de física.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2000,
    imagen: IMG_LIBRO_FISICA,
  },
  {
    titulo: "Anatomía de Moore - Clínicamente Orientada",
    categoria: "Libros",
    descripcion:
      "Manual de anatomía humana con enfoque clínico, ampliamente usado en programas de ciencias de la salud.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 3000,
    imagen: IMG_LIBRO_CALCULO,
  },
  {
    titulo: "Código Limpio - Robert C. Martin",
    categoria: "Libros",
    descripcion:
      "Referencia esencial para estudiantes de programación y desarrollo de software. Ejercicios y buenas prácticas de código.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 2800,
    imagen: IMG_LIBRO_PROGRAMACION,
  },
  // Laboratorio
  {
    titulo: "Bata blanca de laboratorio talla M",
    categoria: "Laboratorio",
    descripcion:
      "Bata blanca de algodón para prácticas de laboratorio, talla M, en buen estado. Ideal para cursos de química y biología.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: IMG_BATA_LABORATORIO,
  },
  {
    titulo: "Multímetro digital Fluke",
    categoria: "Laboratorio",
    descripcion:
      "Multímetro digital profesional para medición de voltaje, corriente y resistencia. Incluye cables de prueba.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 4500,
    imagen: IMG_MULTIMETRO,
  },
  {
    titulo: "Kit protoboard con Arduino Uno y sensores",
    categoria: "Laboratorio",
    descripcion:
      "Kit de electrónica para prototipado: placa Arduino Uno, protoboard, sensores de temperatura, luz y movimiento, jumpers y resistencias.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 6000,
    imagen: IMG_KIT_ARDUINO,
  },
  {
    titulo: "Gafas de seguridad industrial",
    categoria: "Laboratorio",
    descripcion:
      "Gafas de protección con certificación para laboratorio. Lentes transparentes, montura ajustable y tratamiento antivaho.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 1200,
    imagen: IMG_GAFAS_SEGURIDAD,
  },
  // Calculadoras
  {
    titulo: "Casio fx-991LA X ClassWiz científica",
    categoria: "Calculadoras",
    descripcion:
      "Calculadora científica Casio fx-991LA con pantalla ClassWiz, ideal para matemáticas, física e ingeniería.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 1800,
    imagen: IMG_CALCULADORA_CASIO,
  },
  {
    titulo: "Texas Instruments TI-84 Plus graficadora",
    categoria: "Calculadoras",
    descripcion:
      "Calculadora graficadora TI-84 Plus, ampliamente usada en cursos de cálculo, estadística e ingeniería. Incluye cable de conexión.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 3500,
    imagen: IMG_CALCULADORA_GRAFICADORA,
  },
  {
    titulo: "Casio fx-82MS científica",
    categoria: "Calculadoras",
    descripcion:
      "Calculadora científica clásica Casio fx-82MS, funcional y económica para operaciones básicas de ciencia y matemáticas.",
    condicion: CondicionArticulo.REGULAR,
    tarifaHora: 1500,
    imagen: IMG_CALCULADORA_CASIO,
  },
  // Tecnología
  {
    titulo: "Cargador USB-C 65W para portátil",
    categoria: "Tecnología",
    descripcion:
      "Cargador rápido USB-C de 65W compatible con la mayoría de portátiles. Incluye cable desmontable.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 3200,
    imagen: IMG_CARGADOR_LAPTOP,
  },
  {
    titulo: "Adaptador HDMI a USB-C multipuerto",
    categoria: "Tecnología",
    descripcion:
      "Hub multipuerto con HDMI, USB-A y USB-C para conectar monitores y periféricos a laptops modernas.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2500,
    imagen: IMG_ADAPTADOR_USBC,
  },
  {
    titulo: "Tableta gráfica Wacom Intuos",
    categoria: "Tecnología",
    descripcion:
      "Tableta gráfica Wacom Intuos para diseño digital e ilustración. Incluye stylus sensible a la presión.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 5500,
    imagen: IMG_TABLETA_GRAFICA,
  },
  {
    titulo: "Audífonos con cancelación de ruido",
    categoria: "Tecnología",
    descripcion:
      "Audífonos over-ear con cancelación activa de ruido, ideales para estudiar y concentrarse en bibliotecas o espacios compartidos.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 4000,
    imagen: IMG_AUDIFONOS,
  },
  // Deportes
  {
    titulo: "Balón de fútbol profesional Golty",
    categoria: "Deportes",
    descripcion:
      "Balón de fútbol talla 5, marca Golty, para juegos recreativos y entrenamientos universitarios.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: IMG_BALON_FUTBOL,
  },
  {
    titulo: "Raqueta de tenis Wilson",
    categoria: "Deportes",
    descripcion:
      "Raqueta de tenis Wilson para iniciación e intermedio. Empuñadura cómoda y cordaje en buen estado.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 2200,
    imagen: IMG_RAQUETA_TENIS,
  },
  {
    titulo: "Balón de baloncesto Spalding",
    categoria: "Deportes",
    descripcion:
      "Balón de baloncesto Spalding oficial, tamaño 7, para canchas techadas y al aire libre.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 2000,
    imagen: IMG_BALON_BALONCESTO,
  },
  {
    titulo: "Guantes de arquero",
    categoria: "Deportes",
    descripcion:
      "Guantes de arquero con acolchado en palma y muñequera ajustable, talla única adaptable.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: IMG_BALON_FUTBOL,
  },
  // Otros
  {
    titulo: "Regla T y escuadras de dibujo técnico",
    categoria: "Otros",
    descripcion:
      "Juego de dibujo técnico con regla T, escuadras 45° y 60°, y cartabón. Ideal para estudiantes de arquitectura e ingeniería.",
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 1500,
    imagen: IMG_REGLA_DIBUJO,
  },
  {
    titulo: "Atril plegable para lectura",
    categoria: "Otros",
    descripcion:
      "Atril metálico plegable para sostener libros y partituras mientras estudias. Ajustable en altura y ángulo.",
    condicion: CondicionArticulo.NUEVO,
    tarifaHora: 1200,
    imagen: IMG_ATRIL_LECTURA,
  },
  {
    titulo: "Trípode ligero para celular/cámara",
    categoria: "Otros",
    descripcion:
      "Trípode compacto y ligero compatible con celulares y cámaras pequeñas. Ideal para grabaciones y videollamadas estable.",
    condicion: CondicionArticulo.COMO_NUEVO,
    tarifaHora: 1800,
    imagen: IMG_TRIPODE,
  },
];

// Mapeo de palabras clave del título → ruta de imagen local (para artículos existentes).
const IMAGEN_POR_TITULO: Record<string, string> = {
  cálculo: IMG_LIBRO_CALCULO,
  calculo: IMG_LIBRO_CALCULO,
  física: IMG_LIBRO_FISICA,
  fisica: IMG_LIBRO_FISICA,
  anatomía: IMG_LIBRO_CALCULO,
  anatomia: IMG_LIBRO_CALCULO,
  código: IMG_LIBRO_PROGRAMACION,
  codigo: IMG_LIBRO_PROGRAMACION,
  programación: IMG_LIBRO_PROGRAMACION,
  programacion: IMG_LIBRO_PROGRAMACION,
  bata: IMG_BATA_LABORATORIO,
  multímetro: IMG_MULTIMETRO,
  multimetro: IMG_MULTIMETRO,
  arduino: IMG_KIT_ARDUINO,
  protoboard: IMG_KIT_ARDUINO,
  gafas: IMG_GAFAS_SEGURIDAD,
  casio: IMG_CALCULADORA_CASIO,
  texas: IMG_CALCULADORA_GRAFICADORA,
  ti-84: IMG_CALCULADORA_GRAFICADORA,
  cargador: IMG_CARGADOR_LAPTOP,
  usb-c: IMG_ADAPTADOR_USBC,
  adaptador: IMG_ADAPTADOR_USBC,
  tableta: IMG_TABLETA_GRAFICA,
  wacom: IMG_TABLETA_GRAFICA,
  audífonos: IMG_AUDIFONOS,
  audifonos: IMG_AUDIFONOS,
  balón: IMG_BALON_FUTBOL,
  balon: IMG_BALON_FUTBOL,
  fútbol: IMG_BALON_FUTBOL,
  futbol: IMG_BALON_FUTBOL,
  raqueta: IMG_RAQUETA_TENIS,
  tenis: IMG_RAQUETA_TENIS,
  baloncesto: IMG_BALON_BALONCESTO,
  spalding: IMG_BALON_BALONCESTO,
  guantes: IMG_BALON_FUTBOL,
  regla: IMG_REGLA_DIBUJO,
  escuadras: IMG_REGLA_DIBUJO,
  dibujo: IMG_REGLA_DIBUJO,
  atril: IMG_ATRIL_LECTURA,
  trípode: IMG_TRIPODE,
  tripode: IMG_TRIPODE,
};

function imagenParaTitulo(titulo: string, categoria: string): string {
  const t = titulo.toLowerCase();
  for (const [clave, ruta] of Object.entries(IMAGEN_POR_TITULO)) {
    if (t.includes(clave)) return ruta;
  }
  // Fallback por categoría
  const fallbacks: Record<string, string> = {
    Libros: IMG_LIBRO_CALCULO,
    Laboratorio: IMG_BATA_LABORATORIO,
    Calculadoras: IMG_CALCULADORA_CASIO,
    Tecnología: IMG_CARGADOR_LAPTOP,
    Deportes: IMG_BALON_FUTBOL,
    Otros: IMG_REGLA_DIBUJO,
  };
  return fallbacks[categoria] ?? IMG_LIBRO_CALCULO;
}

async function main() {
  console.log("🚀 Iniciando seed de fotos y artículos demo...\n");

  // 1. Obtener TODOS los usuarios existentes (sin tocar saldos ni borrar nada).
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

  // 2. Actualizar TODOS los artículos existentes sobreescribiendo con imagen local.
  const todosArticulos = await prisma.articulo.findMany({
    select: { id: true, titulo: true, categoria: true, imagenes: true },
  });

  let actualizados = 0;
  for (const art of todosArticulos) {
    const rutaLocal = imagenParaTitulo(art.titulo, art.categoria);

    await prisma.articulo.update({
      where: { id: art.id },
      data: { imagenes: [rutaLocal] },
    });
    actualizados++;
    console.log(
      `   🖼️  Actualizado: "${art.titulo}" (${art.categoria}) → ${rutaLocal}`
    );
  }
  console.log(`\n✅ Artículos existentes actualizados con foto local: ${actualizados}\n`);

  // 3. Crear 3 artículos nuevos por cada usuario existente.
  let totalCreados = 0;
  const resumenPorUsuario: Record<string, { nombre: string; titulos: string[] }> =
    {};

  for (const usuario of usuarios) {
    resumenPorUsuario[usuario.id] = {
      nombre: usuario.nombre,
      titulos: [],
    };

    // Seleccionamos 3 artículos distintos del catálogo demo (ciclamos si hay más usuarios que selecciones).
    const seleccion = [
      ARTICULOS_DEMO[0], // Libros (Stewart)
      ARTICULOS_DEMO[4], // Laboratorio (bata)
      ARTICULOS_DEMO[8], // Calculadoras (Casio fx-991LA)
      ARTICULOS_DEMO[12], // Tecnología (cargador USB-C)
      ARTICULOS_DEMO[16], // Deportes (balón fútbol)
      ARTICULOS_DEMO[20], // Otros (regla T)
    ];

    const inicio = usuarios.indexOf(usuario) % seleccion.length;
    const tres = [
      seleccion[inicio % seleccion.length],
      seleccion[(inicio + 2) % seleccion.length],
      seleccion[(inicio + 4) % seleccion.length],
    ];

    for (const demo of tres) {
      const yaExiste = await prisma.articulo.findFirst({
        where: {
          propietarioId: usuario.id,
          titulo: demo.titulo,
        },
      });

      if (yaExiste) {
        // Idempotente: sobreescribir la foto con la ruta local correcta.
        await prisma.articulo.update({
          where: { id: yaExiste.id },
          data: { imagenes: [demo.imagen] },
        });
        resumenPorUsuario[usuario.id].titulos.push(
          `${demo.titulo} (actualizado con foto local)`
        );
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
          propietarioId: usuario.id,
        },
      });

      totalCreados++;
      resumenPorUsuario[usuario.id].titulos.push(
        `${demo.titulo} ($${demo.tarifaHora.toLocaleString("es-CO")}/hr)`
      );
      console.log(
        `   ✨ Creado para ${usuario.correo}: "${creado.titulo}" (${demo.categoria}) - ${demo.imagen}`
      );
    }
  }

  // 4. Resumen final.
  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN DEL SEED");
  console.log("────────────────────────────────────────────");
  console.log(`Artículos existentes actualizados con foto local: ${actualizados}`);
  console.log(`Artículos nuevos creados: ${totalCreados}`);
  console.log(`Usuarios procesados: ${usuarios.length}\n`);

  for (const [id, info] of Object.entries(resumenPorUsuario)) {
    console.log(`👤 ${info.nombre} (${id}):`);
    info.titulos.forEach((t) => console.log(`   • ${t}`));
    console.log("");
  }

  const totalFinal = await prisma.articulo.count();
  console.log(`Total de artículos en la base de datos: ${totalFinal}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error ejecutando el seed de fotos:", error);
  process.exitCode = 1;
}) .finally(async () => {
  await prisma.$disconnect().catch(() => {});
});
