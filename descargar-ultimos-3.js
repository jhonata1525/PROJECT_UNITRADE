/**
 * @file descargar-ultimos-3.js
 * Descarga los 3 archivos restantes/problemáticos:
 * - libro-fisica.jpg, libro-programacion.jpg (fallaron completamente)
 * - adaptador-usbc.jpg (solo 10 KB, necesita > 10 KB)
 *
 * Usa múltiples categorías alternativas y paginación completa.
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
  "magazine", "journal", "memorial", "tablet", "seed book", "workstation",
  "circuit board", "battery charger", "terminal", "oxygen mask", "museum",
  "historical", "antique", "vintage", "old", "classic", "retro",
  "police", "forensic", "brigade", "soldier", "military", "war",
];

const TAREAS = {
  "libro-fisica.jpg": {
    files: ["File:University Physics.jpg", "File:Physics textbook.jpg", "File:Physics book.jpg", "File:Fundamentals of Physics.jpg"],
    categorias: ["Category:Physics books", "Category:Physics textbooks", "Category:Science books"],
  },
  "libro-programacion.jpg": {
    files: ["File:Programming book.jpg", "File:Computer programming.jpg", "File:Software engineering book.jpg", "File:Coding book.jpg"],
    categorias: ["Category:Computer books", "Category:Programming", "Category:Software engineering"],
  },
  "adaptador-usbc.jpg": {
    files: ["File:USB Type-C hub.jpg", "File:USB-C hub.jpg", "File:USB hub.jpg", "File:USB-C adapter.jpg", "File:Type-C adapter.jpg"],
    categorias: ["Category:USB", "Category:Computer hardware", "Category:Electronics"],
  },
};

function contieneExcluido(texto) {
  if (!texto) return false;
  const lower = texto.toLowerCase();
  return EXCLUIR_TITULO.some((palabra) => lower.includes(palabra));
}

async function obtenerInfoFile(nombreFile) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&titles=" + encodeURIComponent(nombreFile) +
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
    if (pagina.missing) return { missing: true };
    const info = pagina.imageinfo?.[0];
    if (!info) return null;

    const mime = info.mime || "";
    if (!mime.startsWith("image/")) return null;
    if (mime === "image/svg+xml") return null;
    if (mime === "image/vnd.djvu") return null;
    if (mime === "image/tiff") return null;

    const tamaño = info.size || 0;
    if (tamaño > 0 && tamaño < LIMITE_TAMANO_KB * 1024) return null;

    const titulo = pagina.title || "";
    if (contieneExcluido(titulo)) return null;

    const urlLower = (info.url || "").toLowerCase();
    if (
      urlLower.includes("person") ||
      urlLower.includes("portrait") ||
      urlLower.includes("model") ||
      urlLower.includes("wearing") ||
      urlLower.includes("holding")
    ) {
      return null;
    }

    return {
      url: info.url,
      thumb: info.thumburl || info.url,
      mime,
      tamaño,
      titulo,
    };
  }
  return null;
}

async function obtenerMiembrosCategoria(nombreCategoria) {
  const miembros = [];
  let cmcontinue = "";

  do {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&list=categorymembers" +
      "&cmtitle=" + encodeURIComponent(nombreCategoria) +
      "&cmtype=file" +
      "&cmlimit=50" +
      (cmcontinue ? "&cmcontinue=" + encodeURIComponent(cmcontinue) : "") +
      "&format=json";

    const respuesta = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    if (!respuesta.ok) throw new Error(`Wikimedia API respondió ${respuesta.status}`);
    const datos = await respuesta.json();
    const lista = datos.query?.categorymembers;
    if (lista) {
      for (const miembro of lista) {
        miembros.push(miembro.title || "");
      }
    }
    cmcontinue = datos.query?.cmcontinue || "";
  } while (cmcontinue && miembros.length < 300);

  return miembros;
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
  for (const [nombreArchivo, tarea] of Object.entries(TAREAS)) {
    const destino = path.join(CARPETA_DESTINO, nombreArchivo);
    let exito = false;
    let ultimoError = "";

    // 1. Probar nombres exactos de File:
    for (const nombreFile of tarea.files) {
      try {
        console.log(`🔍 File: ${nombreFile}`);
        const info = await obtenerInfoFile(nombreFile);

        if (info && !info.missing) {
          console.log(`   ↳ ${info.titulo} | ${info.url} (${info.mime}, ${Math.round(info.tamaño / 1024)} KB)`);
          await descargarImagen(info.thumb, destino);
          const stats = fs.statSync(destino);
          console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
          exito = true;
          break;
        } else {
          console.log(`   ⚠️  ${nombreFile} no existe`);
        }
      } catch (error) {
        ultimoError = error.message;
        console.warn(`   ⚠️  Error: ${error.message}`);
      }
    }

    // 2. Si falló, probar categorías
    if (!exito) {
      for (const categoria of tarea.categorias) {
        try {
          console.log(`   Buscando en categoría: ${categoria}`);
          const miembros = await obtenerMiembrosCategoria(categoria);
          console.log(`     ${miembros.length} miembros`);

          for (const titulo of miembros) {
            if (contieneExcluido(titulo)) continue;

            try {
              const info = await obtenerInfoFile(titulo);
              if (info && !info.missing) {
                console.log(`     ↳ ${info.titulo} (${Math.round(info.tamaño / 1024)} KB)`);
                await descargarImagen(info.thumb, destino);
                const stats = fs.statSync(destino);
                console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
                exito = true;
                break;
              }
            } catch {
              continue;
            }
          }
          if (exito) break;
        } catch (error) {
          console.warn(`     Error en categoría ${categoria}: ${error.message}`);
        }
      }
    }

    if (!exito) {
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
    }
  }
  console.log("\nDescarga de los 3 archivos completada.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
