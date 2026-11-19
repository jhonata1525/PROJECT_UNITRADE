/**
 * @file descargar-reintento.js
 * Reintenta descargar imágenes fallidas o inadecuadas de Wikimedia Commons.
 */

import fs from "fs";
import path from "path";

const CARPETA_DESTINO = path.join(process.cwd(), "frontend/public/articulos");
const LIMITE_TAMANO_KB = 10;
const USER_AGENT = "UniTradeSeed/1.0 (contact: admin@unisimon.edu.co)";

// Archivos que necesitan reintento (fallidos o inadecuados)
const BUSQUEDAS = {
  "kit-arduino.jpg": [
    "Arduino Uno microcontroller board",
    "Arduino Uno R3 electronics",
    "Arduino breadboard project",
  ],
  "gafas-seguridad.jpg": [
    "safety goggles laboratory",
    "laboratory eye protection glasses",
    "safety spectacles clear",
  ],
  "regla-dibujo.jpg": [
    "set square technical drawing",
    "drafting triangle ruler",
    "technical drawing tools set",
  ],
  "libro-calculo.jpg": [
    "calculus textbook book",
    "mathematics book open",
    "Stewart calculus textbook cover",
  ],
  "libro-programacion.jpg": [
    "programming book computer code",
    "software engineering textbook book",
    "programming languages book",
  ],
  "balon-baloncesto.jpg": [
    "basketball ball sports",
    "Spalding basketball game",
    "basketball isolated white background",
  ],
};

async function buscarImagenCommons(termino) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&generator=search" +
    "&gsrsearch=" + encodeURIComponent(termino) +
    "&gsrnamespace=6" +
    "&gsrlimit=10" +
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

  for (const [, pagina] of Object.entries(paginas)) {
    const info = pagina.imageinfo?.[0];
    if (!info) continue;
    const mime = info.mime || "";
    if (!mime.startsWith("image/")) continue;
    if (mime === "image/svg+xml") continue;
    if (mime === "image/vnd.djvu") continue;
    const tamaño = info.size || 0;
    if (tamaño > 0 && tamaño < LIMITE_TAMANO_KB * 1024) continue;
    return { url: info.url, thumb: info.thumburl || info.url, mime, tamaño };
  }
  return null;
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
        console.log(`🔍 "${termino}" para ${nombreArchivo}`);
        const imagen = await buscarImagenCommons(termino);
        if (!imagen) { ultimoError = `Sin resultados para "${termino}"`; continue; }
        console.log(`   ↳ ${imagen.url} (${imagen.mime}, ${Math.round(imagen.tamaño / 1024)} KB)`);
        await descargarImagen(imagen.thumb, destino);
        const stats = fs.statSync(destino);
        console.log(`   ✅ ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
        exito = true;
        break;
      } catch (error) {
        ultimoError = error.message;
        console.warn(`   ⚠️  ${error.message}`);
      }
    }
    if (!exito) {
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
    }
  }
  console.log("\nReintento completado.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
