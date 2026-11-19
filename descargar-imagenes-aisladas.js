/**
 * @file descargar-imagenes-aisladas.js
 * Descarga imágenes de objetos aislados (SIN personas, manos ni rostros)
 * desde Wikimedia Commons API.
 *
 * Estrategia:
 * 1. Búsquedas amplias con múltiples términos alternativos por objeto.
 * 2. Filtro estricto: rechazar títulos de archivo que contengan palabras de personas.
 * 3. Verificar tamaño > 10 KB y content-type de imagen real.
 *
 * Uso: node descargar-imagenes-aisladas.js
 */

import fs from "fs";
import path from "path";

const CARPETA_DESTINO = path.join(process.cwd(), "frontend/public/articulos");
const LIMITE_TAMANO_KB = 10;
const USER_AGENT = "UniTradeSeed/1.0 (contact: admin@unisimon.edu.co)";

// Palabras clave que EXCLUYEN resultados con personas (en título de archivo)
const EXCLUIR_TITULO = [
  "person", "people", "man", "woman", "student", "doctor", "scientist",
  "student", "doctor", "nurse", "teacher", "professor", "researcher",
  "worker", "lab", "hands", "hand", "holding", "wearing", "wears",
  "player", "portrait", "model", "human", "face", "head", "fashion",
  "wear", "worn", "on-body", "using", "user", "male", "female", "boy",
  "girl", "child", "baby", "infant", "guy", "lady", "gentleman",
  "sportsman", "athlete", "gamer", "pilot", "driver", "chef", "cook",
  "waiter", "waitress", "barber", "hairdresser", "dancer", "singer",
  "actor", "actress", "musician", "violinist", "pianist", "guitarist",
  "footballer", "tennis", "basketball", "volleyball", "golfer", "swimmer",
  "runner", "cyclist", "boxer", "wrestler", "judoka", "karate", "taekwondo",
  "mario", "luigi", "pikachu", "mickey", "minnie", "donald", "bugs",
];

// Mapa: archivo -> términos de búsqueda (sin "isolated" obligatorio, más amplios)
const BUSQUEDAS = {
  "bata-laboratorio.jpg": [
    "lab coat clothing isolated",
    "white coat garment object",
    "laboratory coat still life",
    "lab coat object",
  ],
  "calculadora-casio.jpg": [
    "Casio calculator object",
    "scientific calculator device",
    "calculator electronics object",
    "Casio fx calculator",
  ],
  "calculadora-graficadora.jpg": [
    "TI-84 calculator object",
    "graphing calculator device",
    "Texas Instruments calculator",
    "graphing calculator electronics",
  ],
  "libro-calculo.jpg": [
    "calculus book object",
    "mathematics textbook isolated",
    "calculus book still life",
    "math book object",
  ],
  "libro-fisica.jpg": [
    "physics book object",
    "physics textbook isolated",
    "science book still life",
    "physics book object",
  ],
  "libro-programacion.jpg": [
    "programming book object",
    "software book isolated",
    "computer book still life",
    "programming textbook",
  ],
  "multimetro-digital.jpg": [
    "digital multimeter object",
    "multimeter electronics isolated",
    "multimeter device still life",
    "digital multimeter tool",
  ],
  "kit-arduino.jpg": [
    "Arduino board object",
    "Arduino Uno electronics isolated",
    "Arduino microcontroller device",
    "Arduino board still life",
  ],
  "gafas-seguridad.jpg": [
    "safety glasses object",
    "protective eyewear isolated",
    "safety goggles device still life",
    "protective glasses object",
  ],
  "adaptador-usbc.jpg": [
    "USB-C adapter object",
    "USB hub device isolated",
    "USB-C multiport adapter still life",
    "USB adapter object",
  ],
  "cargador-laptop.jpg": [
    "laptop charger object",
    "USB-C power adapter isolated",
    "laptop charger device still life",
    "power adapter object",
  ],
  "tableta-grafica.jpg": [
    "drawing tablet object",
    "graphics tablet isolated",
    "digital tablet device still life",
    "drawing tablet pen object",
  ],
  "audifonos.jpg": [
    "headphones object isolated",
    "over-ear headphones device",
    "headphones still life object",
    "audio headphones object",
  ],
  "balon-futbol.jpg": [
    "soccer ball object isolated",
    "football device still life",
    "soccer ball object white background",
    "football isolated object",
  ],
  "balon-baloncesto.jpg": [
    "basketball object isolated",
    "basketball device still life",
    "basketball object white background",
    "basketball isolated object",
  ],
  "raqueta-tenis.jpg": [
    "tennis racket object isolated",
    "tennis racquet device still life",
    "tennis racket object white background",
    "tennis racquet isolated object",
  ],
  "atril-lectura.jpg": [
    "book stand object isolated",
    "music stand device still life",
    "book stand object white background",
    "reading stand isolated object",
  ],
  "regla-dibujo.jpg": [
    "drafting ruler object isolated",
    "set square device still life",
    "technical ruler object white background",
    "drafting tool isolated object",
  ],
  "tripode.jpg": [
    "camera tripod object isolated",
    "tripod device still life",
    "camera tripod object white background",
    "tripod isolated object",
  ],
};

function contieneExcluido(texto) {
  if (!texto) return false;
  const lower = texto.toLowerCase();
  return EXCLUIR_TITULO.some((palabra) => lower.includes(palabra));
}

async function buscarImagenCommons(termino) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(termino) +
    "&gsrnamespace=6" +
    "&gsrlimit=20" +
    "&prop=imageinfo" +
    "&iiprop=url|size|mime" +
    "&iiurlwidth=800" +
    "&format=json";

  const respuesta = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!respuesta.ok) throw new Error(`Wikimedia API respondió ${respuesta.status}`);
  const datos = await respuesta.json();
  const paginas = datos.query?.pages;
  if (!paginas) return null;

  // Recopilar todos los candidatos válidos
  const candidatos = [];
  for (const [, pagina] of Object.entries(paginas)) {
    const info = pagina.imageinfo?.[0];
    if (!info) continue;

    const mime = info.mime || "";
    if (!mime.startsWith("image/")) continue;
    if (mime === "image/svg+xml") continue;
    if (mime === "image/vnd.djvu") continue;
    if (mime === "image/tiff") continue;

    const tamaño = info.size || 0;
    if (tamaño > 0 && tamaño < LIMITE_TAMANO_KB * 1024) continue;

    const titulo = pagina.title || "";

    // FILTRO CRÍTICO: rechazar si el título contiene palabras de personas
    if (contieneExcluido(titulo)) continue;

    // Rechazar si la URL sugiere persona
    const urlLower = (info.url || "").toLowerCase();
    if (
      urlLower.includes("person") ||
      urlLower.includes("portrait") ||
      urlLower.includes("model") ||
      urlLower.includes("wearing") ||
      urlLower.includes("holding")
    ) {
      continue;
    }

    candidatos.push({
      url: info.url,
      thumb: info.thumburl || info.url,
      mime,
      tamaño,
      titulo,
    });
  }

  // Devolver el primer candidato válido (el más relevante según Wikimedia)
  return candidatos.length > 0 ? candidatos[0] : null;
}

async function descargarImagen(url, destino) {
  const respuesta = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (!respuesta.ok) throw new Error(`Descarga falló con ${respuesta.status}`);
  const contentType = respuesta.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) throw new Error(`Content-Type: ${contentType}`);
  const arrayBuffer = await respuesta.arrayBuffer();
  const tamaño = arrayBuffer.byteLength;
  if (tamaño < LIMITE_TAMANO_KB * 1024) throw new Error(`Demasiado pequeño: ${tamaño} bytes`);
  fs.writeFileSync(destino, Buffer.from(arrayBuffer));
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
          ultimoError = `Sin resultados válidos para "${termino}"`;
          continue;
        }

        console.log(
          `   ↳ ${imagen.titulo} | ${imagen.url} (${imagen.mime}, ${Math.round(imagen.tamaño / 1024)} KB)`
        );

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
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
      resultados.push({ archivo: nombreArchivo, exito: false, error: ultimoError });
    }
  }

  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN DE DESCARGA DE IMÁGENES");
  console.log("────────────────────────────────────────────");
  const exitos = resultados.filter((r) => r.exito).length;
  const fallos = resultados.filter((r) => !r.exito).length;
  console.log(`✅ Exitosos: ${exitos}`);
  console.log(`❌ Fallidos: ${fallos}`);

  if (fallos > 0) {
    console.log("\nArchivos fallidos:");
    for (const r of resultados.filter((r) => !r.exito)) {
      console.log(`   - ${r.archivo}: ${r.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\n🎉 Todas las imágenes se descargaron correctamente (sin personas).");
  }
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});
