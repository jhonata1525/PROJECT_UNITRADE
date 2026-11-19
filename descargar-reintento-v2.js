/**
 * @file descargar-reintento-v2.js
 * Reintenta descargar imágenes fallidas o incorrectas de Wikimedia Commons.
 * Obtiene MÚLTIPLES candidatos (gsrlimit=50) y filtra estrictamente por título.
 */

import fs from "fs";
import path from "path";

const CARPETA_DESTINO = path.join(process.cwd(), "frontend/public/articulos");
const LIMITE_TAMANO_KB = 10;
const USER_AGENT = "UniTradeSeed/1.0 (contact: admin@unisimon.edu.co)";

const EXCLUIR_TITULO = [
  "person", "people", "man", "woman", "student", "doctor", "scientist",
  "worker", "hands", "hand", "holding", "wearing", "wears", "player",
  "portrait", "model", "human", "face", "head", "fashion", "wear", "worn",
  "male", "female", "boy", "girl", "child", "baby", "infant", "guy", "lady",
  "gentleman", "sportsman", "athlete", "gamer", "pilot", "driver", "chef",
  "cook", "waiter", "waitress", "barber", "hairdresser", "dancer", "singer",
  "actor", "actress", "musician", "footballer", "tennis", "basketball",
  "volleyball", "golfer", "swimmer", "runner", "cyclist", "boxer", "wrestler",
  "mario", "luigi", "pikachu", "mickey", "minnie", "donald", "bugs",
  // Títulos engañosos que no son el objeto
  "barn", "logo", "magazine", "journal", "memorial", "tablet", "seed book",
  "workstation", "circuit board", "battery charger",
];

// Archivos a reintentar (fallidos o incorrectos)
const BUSQUEDAS = {
  // Fallados completamente
  "bata-laboratorio.jpg": [
    "laboratory coat object",
    "medical coat garment",
    "doctor coat object",
    "lab coat clothing",
    "white coat garment",
  ],
  "raqueta-tenis.jpg": [
    "tennis racquet object",
    "badminton racket isolated",
    "squash racquet object",
    "tennis racket device",
    "tennis racquet still life",
  ],
  "regla-dibujo.jpg": [
    "set square object",
    "triangle ruler isolated",
    "protractor device",
    "drafting triangle object",
    "technical drawing ruler",
  ],
  // Incorrectos (títulos engañosos)
  "tableta-grafica.jpg": [
    "graphics tablet object",
    "drawing tablet device isolated",
    "pen tablet computer isolated",
    "graphics input tablet object",
    "digitizer tablet object",
  ],
  "audifonos.jpg": [
    "headphones object isolated",
    "stereo headphones device",
    "audio headphones still life",
    "headset object isolated",
    "earphones object",
  ],
  "balon-futbol.jpg": [
    "soccer ball object isolated",
    "association football device",
    "football ball object still life",
    "soccer ball isolated object",
    "football sport object",
  ],
  "balon-baloncesto.jpg": [
    "basketball object isolated",
    "basketball ball device",
    "basketball sport object still life",
    "basketball isolated object",
    "basketball game object",
  ],
  "adaptador-usbc.jpg": [
    "USB-C adapter object",
    "USB hub device isolated",
    "USB-C multiport adapter still life",
    "USB adapter object isolated",
    "type C adapter object",
  ],
  "atril-lectura.jpg": [
    "book stand object isolated",
    "music stand device still life",
    "book rest object isolated",
    "reading stand isolated object",
    "lectern object isolated",
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
    "&gsrlimit=50" +
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
    if (contieneExcluido(titulo)) continue;

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

  return candidatos.length > 0 ? candidatos : null;
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
  for (const [nombreArchivo, terminos] of Object.entries(BUSQUEDAS)) {
    const destino = path.join(CARPETA_DESTINO, nombreArchivo);
    let exito = false;
    let ultimoError = "";

    for (const termino of terminos) {
      try {
        console.log(`🔍 Reintentando: "${termino}" para ${nombreArchivo}`);
        const candidatos = await buscarImagenCommons(termino);

        if (!candidatos || candidatos.length === 0) {
          ultimoError = `Sin resultados válidos para "${termino}"`;
          continue;
        }

        console.log(`   Encontrados ${candidatos.length} candidatos`);

        // Probar cada candidato hasta que uno se descargue correctamente
        for (const candidato of candidatos) {
          try {
            console.log(`   ↳ ${candidato.titulo} (${Math.round(candidato.tamaño / 1024)} KB)`);
            await descargarImagen(candidato.thumb, destino);
            const stats = fs.statSync(destino);
            console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
            exito = true;
            break;
          } catch (error) {
            console.warn(`   ⚠️  Falló descarga de candidato: ${error.message}`);
          }
        }

        if (exito) break;
      } catch (error) {
        ultimoError = error.message;
        console.warn(`   ⚠️  Falló búsqueda "${termino}": ${error.message}`);
      }
    }

    if (!exito) {
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
    }
  }
  console.log("\nReintento completado.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
