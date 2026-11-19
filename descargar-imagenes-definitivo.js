/**
 * @file descargar-imagenes-definitivo.js
 * Descarga 19 imágenes reales de objetos aislados desde Wikimedia Commons.
 *
 * Estrategia:
 * 1. Intenta el nombre exacto de File: (ej. File:Lab_coat.jpg)
 * 2. Si falta, prueba nombres alternativos de File: para el mismo objeto
 * 3. Si aún falta, busca en categorías con paginación completa (cmcontinue)
 *    y múltiples categorías alternativas
 * 4. Filtro estricto: rechaza títulos con personas, retratos, manos, etc.
 * 5. Valida: HTTP 200, content-type imagen, tamaño > 10 KB
 *
 * Uso: node descargar-imagenes-definitivo.js
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
];

// Archivo local -> lista de nombres de File: a probar (en orden de preferencia)
const ARCHIVOS_FILE = {
  "bata-laboratorio.jpg": [
    "File:Lab coat.jpg",
    "File:White lab coat.jpg",
    "File:Laboratory coat.jpg",
  ],
  "calculadora-casio.jpg": [
    "File:Casio fx-991EX 01.jpg",
    "File:Casio fx-991ES.jpg",
    "File:Casio scientific calculator.jpg",
  ],
  "calculadora-graficadora.jpg": [
    "File:TI-84 Plus graphing.jpg",
    "File:TI-84 Plus.jpg",
    "File:Graphing calculator.jpg",
  ],
  "libro-calculo.jpg": [
    "File:Calculus textbook.jpg",
    "File:Calculus book.jpg",
    "File:Mathematics textbook.jpg",
  ],
  "libro-fisica.jpg": [
    "File:University Physics textbook.jpg",
    "File:Physics textbook.jpg",
    "File:Physics book.jpg",
  ],
  "libro-programacion.jpg": [
    "File:Clean Code book.jpg",
    "File:Programming book.jpg",
    "File:Computer programming book.jpg",
  ],
  "multimetro-digital.jpg": [
    "File:Digital multimeter Mastech MAS830L.jpg",
    "File:Digital multimeter.jpg",
    "File:Multimeter.jpg",
  ],
  "kit-arduino.jpg": [
    "File:Arduino Uno - R3.jpg",
    "File:Arduino Uno.jpg",
    "File:Arduino board.jpg",
  ],
  "gafas-seguridad.jpg": [
    "File:Safety glasses.jpg",
    "File:Safety goggles.jpg",
    "File:Protective eyewear.jpg",
  ],
  "adaptador-usbc.jpg": [
    "File:USB Type-C hub.jpg",
    "File:USB-C hub.jpg",
    "File:USB hub.jpg",
  ],
  "cargador-laptop.jpg": [
    "File:USB-C power adapter.jpg",
    "File:Laptop charger.jpg",
    "File:Power adapter.jpg",
  ],
  "tableta-grafica.jpg": [
    "File:Wacom Intuos graphics tablet.jpg",
    "File:Graphics tablet.jpg",
    "File:Drawing tablet.jpg",
  ],
  "audifonos.jpg": [
    "File:Headphones 1.jpg",
    "File:Headphones.jpg",
    "File:Over-ear headphones.jpg",
  ],
  "balon-futbol.jpg": [
    "File:Soccer ball.svg",
    "File:Adidas Telstar 18.jpg",
    "File:Football ball.jpg",
  ],
  "balon-baloncesto.jpg": [
    "File:Basketball.png",
    "File:Basketball ball.jpg",
    "File:Basketball.jpg",
  ],
  "raqueta-tenis.jpg": [
    "File:Tennis racket and balls.jpg",
    "File:Tennis racket.jpg",
    "File:Tennis racquet.jpg",
  ],
  "atril-lectura.jpg": [
    "File:Music stand.jpg",
    "File:Book stand.jpg",
    "File:Reading stand.jpg",
  ],
  "regla-dibujo.jpg": [
    "File:Set square and ruler.jpg",
    "File:Set square.jpg",
    "File:Drafting triangle.jpg",
  ],
  "tripode.jpg": [
    "File:Camera tripod.jpg",
    "File:Tripod.jpg",
    "File:Camera tripod stand.jpg",
  ],
};

// Categorías de fallback (múltiples por archivo)
const CATEGORIAS_FALLBACK = {
  "bata-laboratorio.jpg": ["Category:Lab coats", "Category:Medical clothing"],
  "calculadora-casio.jpg": ["Category:Calculators", "Category:Casio"],
  "calculadora-graficadora.jpg": ["Category:Graphing calculators", "Category:Calculators"],
  "libro-calculo.jpg": ["Category:Mathematics books", "Category:Calculus"],
  "libro-fisica.jpg": ["Category:Physics books", "Category:Physics textbooks"],
  "libro-programacion.jpg": ["Category:Computer books", "Category:Programming"],
  "multimetro-digital.jpg": ["Category:Multimeters", "Category:Electronic test equipment"],
  "kit-arduino.jpg": ["Category:Arduino", "Category:Microcontrollers"],
  "gafas-seguridad.jpg": ["Category:Personal protective equipment", "Category:Safety equipment"],
  "adaptador-usbc.jpg": ["Category:USB", "Category:Computer hardware"],
  "cargador-laptop.jpg": ["Category:Power supplies", "Category:Laptop accessories"],
  "tableta-grafica.jpg": ["Category:Graphics tablets", "Category:Computer input devices"],
  "audifonos.jpg": ["Category:Headphones", "Category:Audio equipment"],
  "balon-futbol.jpg": ["Category:Association football balls", "Category:Sports equipment"],
  "balon-baloncesto.jpg": ["Category:Basketballs", "Category:Sports equipment"],
  "raqueta-tenis.jpg": ["Category:Tennis rackets", "Category:Sports equipment"],
  "atril-lectura.jpg": ["Category:Music stands", "Category:Furniture"],
  "regla-dibujo.jpg": ["Category:Set squares", "Category:Drawing instruments"],
  "tripode.jpg": ["Category:Tripods (photography)", "Category:Photographic equipment"],
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
  } while (cmcontinue && miembros.length < 200);

  return miembros;
}

async function buscarEnCategorias(categorias, nombreArchivo) {
  for (const categoria of categorias) {
    try {
      console.log(`   Buscando en categoría: ${categoria}`);
      const miembros = await obtenerMiembrosCategoria(categoria);
      console.log(`     ${miembros.length} miembros encontrados`);

      for (const titulo of miembros) {
        if (contieneExcluido(titulo)) continue;

        try {
          const info = await obtenerInfoFile(titulo);
          if (info && !info.missing) {
            console.log(`     ↳ ${info.titulo} (${Math.round(info.tamaño / 1024)} KB)`);
            return info;
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      console.warn(`     Error en categoría ${categoria}: ${error.message}`);
    }
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
  if (!fs.existsSync(CARPETA_DESTINO)) {
    fs.mkdirSync(CARPETA_DESTINO, { recursive: true });
  }

  const resultados = [];

  for (const [nombreArchivo, archivosFile] of Object.entries(ARCHIVOS_FILE)) {
    const destino = path.join(CARPETA_DESTINO, nombreArchivo);
    let exito = false;
    let ultimoError = "";

    // 1. Probar nombres exactos de File:
    for (const nombreFile of archivosFile) {
      try {
        console.log(`🔍 File: ${nombreFile}`);
        const info = await obtenerInfoFile(nombreFile);

        if (info && !info.missing) {
          console.log(`   ↳ ${info.titulo} | ${info.url} (${info.mime}, ${Math.round(info.tamaño / 1024)} KB)`);
          await descargarImagen(info.thumb, destino);
          const stats = fs.statSync(destino);
          console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
          resultados.push({ archivo: nombreArchivo, exito: true, tamaño: stats.size });
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

    // 2. Si falló, probar categorías de fallback
    if (!exito) {
      const categorias = CATEGORIAS_FALLBACK[nombreArchivo] || [];
      const infoCat = await buscarEnCategorias(categorias, nombreArchivo);

      if (infoCat && !infoCat.missing) {
        try {
          console.log(`   ↳ Categoría: ${infoCat.titulo} | ${infoCat.url} (${infoCat.mime}, ${Math.round(infoCat.tamaño / 1024)} KB)`);
          await descargarImagen(infoCat.thumb, destino);
          const stats = fs.statSync(destino);
          console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
          resultados.push({ archivo: nombreArchivo, exito: true, tamaño: stats.size });
          exito = true;
        } catch (error) {
          ultimoError = error.message;
        }
      }
    }

    if (!exito) {
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
      resultados.push({ archivo: nombreArchivo, exito: false, error: ultimoError });
    }
  }

  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN DE DESCARGA DEFINITIVA");
  console.log("────────────────────────────────────────────");
  const exitos = resultados.filter((r) => r.exito).length;
  const fallos = resultados.filter((r) => !r.exito).length;
  console.log(`✅ Exitosos: ${exitos}/19`);
  console.log(`❌ Fallidos: ${fallos}`);

  if (fallos > 0) {
    console.log("\nArchivos fallidos:");
    for (const r of resultados.filter((r) => !r.exito)) {
      console.log(`   - ${r.archivo}: ${r.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\n🎉 Las 19 imágenes se descargaron correctamente.");
  }

  // Verificación final de todos los archivos en disco
  console.log("\n────────────────────────────────────────────");
  console.log("📋 VERIFICACIÓN DE ARCHIVOS EN DISCO");
  console.log("────────────────────────────────────────────");
  const archivosEnDisco = fs.readdirSync(CARPETA_DESTINO).filter((f) => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".svg"));
  console.log(`Total archivos en ${CARPETA_DESTINO}: ${archivosEnDisco.length}`);
  let todosValidos = true;
  for (const archivo of archivosEnDisco.sort()) {
    const stats = fs.statSync(path.join(CARPETA_DESTINO, archivo));
    const valido = stats.size > LIMITE_TAMANO_KB * 1024;
    if (!valido) todosValidos = false;
    console.log(`   ${valido ? "✅" : "❌"} ${archivo} (${Math.round(stats.size / 1024)} KB)`);
  }
  if (!todosValidos) {
    console.error("\n❌ Algunos archivos no cumplen el tamaño mínimo.");
    process.exitCode = 1;
  } else {
    console.log("\n✅ Todos los archivos son válidos (> 10 KB).");
  }
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});
