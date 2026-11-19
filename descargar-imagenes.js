/**
 * @file descargar-imagenes.js
 * Descarga imágenes reales verificadas desde Wikimedia Commons API
 * y las guarda en frontend/public/articulos/.
 *
 * Requisitos: Node.js 18+ (fetch nativo).
 *
 * Uso: node descargar-imagenes.js
 */

import fs from "fs";
import path from "path";

const CARPETA_DESTINO = path.join(process.cwd(), "frontend/public/articulos");
const LIMITE_TAMANO_KB = 10;

// Mapa: nombre de archivo -> términos de búsqueda en Wikimedia Commons
const BUSQUEDAS = {
  "bata-laboratorio.jpg": [
    "white lab coat laboratory",
    "laboratory coat white",
    "lab coat scientist",
  ],
  "calculadora-casio.jpg": [
    "Casio scientific calculator",
    "calculadora Casio científica",
    "Casio fx calculator",
  ],
  "calculadora-graficadora.jpg": [
    "Texas Instruments graphing calculator",
    "TI-84 graphing calculator",
    "calculadora graficadora Texas Instruments",
  ],
  "libro-calculo.jpg": [
    "mathematics calculus textbook open book",
    "calculus book Stewart university",
    "libro cálculo universitario abierto",
  ],
  "libro-fisica.jpg": [
    "physics textbook university open book",
    "libro física universitaria Sears Zemansky",
    "physics book open pages",
  ],
  "libro-programacion.jpg": [
    "programming book software engineering",
    "libro programación ingeniería software",
    "computer programming textbook",
  ],
  "multimetro-digital.jpg": [
    "digital multimeter yellow black",
    "multímetro digital amarillo negro",
    "Fluke multimeter electronic",
  ],
  "kit-arduino.jpg": [
    "Arduino Uno breadboard sensors kit",
    "Arduino Uno protoboard cables",
    "electronic prototyping kit Arduino",
  ],
  "gafas-seguridad.jpg": [
    "safety glasses laboratory clear",
    "gafas seguridad laboratorio transparentes",
    "protective eyewear laboratory",
  ],
  "adaptador-usbc.jpg": [
    "USB-C hub adapter HDMI",
    "adaptador USB-C HDMI multipuerto",
    "USB C hub multiport adapter",
  ],
  "cargador-laptop.jpg": [
    "laptop USB-C charger 65W",
    "cargador portátil USB-C",
    "laptop power adapter USB-C",
  ],
  "tableta-grafica.jpg": [
    "drawing tablet stylus Wacom",
    "tableta gráfica lápiz digital",
    "graphics tablet with pen",
  ],
  "audifonos.jpg": [
    "over-ear headphones noise cancelling",
    "audífonos diadema cancelación ruido",
    "studio headphones over ear",
  ],
  "balon-futbol.jpg": [
    "soccer ball football",
    "balón de fútbol profesional",
    "sports soccer ball white black",
  ],
  "balon-baloncesto.jpg": [
    "basketball ball Spalding",
    "balón de baloncesto",
    "basketball indoor court",
  ],
  "raqueta-tenis.jpg": [
    "tennis racket Wilson",
    "raqueta de tenis deportiva",
    "tennis racquet court",
  ],
  "atril-lectura.jpg": [
    "book stand music stand metal wood",
    "atril plegable libros partituras",
    "lectern reading stand",
  ],
  "regla-dibujo.jpg": [
    "drafting ruler set square technical drawing",
    "escuadras regla dibujo técnico",
    "architectural drafting tools",
  ],
  "tripode.jpg": [
    "camera tripod mobile phone",
    "trípode cámara celular",
    "photography tripod lightweight",
  ],
};

const USER_AGENT = "UniTradeSeed/1.0 (contact: admin@unisimon.edu.co)";

async function buscarImagenCommons(termino) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(termino) +
    "&gsrnamespace=6" +
    "&gsrlimit=5" +
    "&prop=imageinfo" +
    "&iiprop=url|size|mime" +
    "&iiurlwidth=800" +
    "&format=json";

  const respuesta = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!respuesta.ok) {
    throw new Error(`Wikimedia API respondió ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  const paginas = datos.query?.pages;
  if (!paginas) return null;

  for (const [, pagina] of Object.entries(paginas)) {
    const info = pagina.imageinfo?.[0];
    if (!info) continue;

    // Solo imágenes reales (no SVG, no GIF animado muy grande)
    const mime = info.mime || "";
    if (!mime.startsWith("image/")) continue;
    if (mime === "image/svg+xml") continue;

    // Verificar tamaño > 10KB si se reporta
    const tamaño = info.size || 0;
    if (tamaño > 0 && tamaño < LIMITE_TAMANO_KB * 1024) continue;

    return {
      url: info.url,
      thumb: info.thumburl || info.url,
      mime,
      tamaño,
    };
  }

  return null;
}

async function descargarImagen(url, destino) {
  const respuesta = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!respuesta.ok) {
    throw new Error(`Descarga falló con ${respuesta.status}`);
  }

  const contentType = respuesta.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Content-Type no es imagen: ${contentType}`);
  }

  const arrayBuffer = await respuesta.arrayBuffer();
  const tamaño = arrayBuffer.byteLength;

  if (tamaño < LIMITE_TAMANO_KB * 1024) {
    throw new Error(`Imagen demasiado pequeña: ${tamaño} bytes`);
  }

  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destino, buffer);
  return { tamaño, contentType };
}

async function main() {
  if (!fs.existsSync(CARPETA_DESTINO)) {
    fs.mkdirSync(CARPETA_DESTINO, { recursive: true });
  }

  const resultados = [];

  for (const [nombreArchivo, terminos] of Object.entries(BUSQUEDAS)) {
    const destino = path.join(CARPETA_DESTINO, nombreArchivo);
    let exito = false;
    let ultimoError = "";

    for (const termino of terminos) {
      try {
        console.log(`🔍 Buscando: "${termino}" para ${nombreArchivo}`);
        const imagen = await buscarImagenCommons(termino);

        if (!imagen) {
          ultimoError = `Sin resultados para "${termino}"`;
          continue;
        }

        console.log(`   ↳ URL encontrada: ${imagen.url} (${imagen.mime}, ${Math.round(imagen.tamaño / 1024)} KB)`);

        await descargarImagen(imagen.thumb, destino);

        const stats = fs.statSync(destino);
        console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
        resultados.push({ archivo: nombreArchivo, termino, exito: true, tamaño: stats.size });
        exito = true;
        break;
      } catch (error) {
        ultimoError = error.message;
        console.warn(`   ⚠️  Falló "${termino}": ${error.message}`);
      }
    }

    if (!exito) {
      console.error(`❌ No se pudo descargar ${nombreArchivo}: ${ultimoError}`);
      resultados.push({ archivo: nombreArchivo, exito: false, error: ultimoError });
    }
  }

  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN DE DESCARGA");
  console.log("────────────────────────────────────────────");
  const exitos = resultados.filter(r => r.exito).length;
  const fallos = resultados.filter(r => !r.exito).length;
  console.log(`✅ Exitosos: ${exitos}`);
  console.log(`❌ Fallidos: ${fallos}`);

  if (fallos > 0) {
    console.log("\nArchivos fallidos:");
    for (const r of resultados.filter(r => !r.exito)) {
      console.log(`   - ${r.archivo}: ${r.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\n🎉 Todas las imágenes se descargaron correctamente.");
  }
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});
