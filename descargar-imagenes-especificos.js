/**
 * @file descargar-imagenes-especificos.js
 * Descarga 19 imágenes reales de objetos aislados desde Wikimedia Commons
 * usando los nombres exactos de archivo (File:...) con fallback a categorías.
 *
 * Valida: HTTP 200, content-type de imagen, tamaño > 10 KB, sin personas.
 *
 * Uso: node descargar-imagenes-especificos.js
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
  "circuit board", "battery charger",
];

// Archivo local -> nombre exacto de File: en Wikimedia Commons
const ARCHIVOS_ESPECIFICOS = {
  "bata-laboratorio.jpg": "File:Lab_coat.jpg",
  "calculadora-casio.jpg": "File:Casio_fx-991EX_01.jpg",
  "calculadora-graficadora.jpg": "File:TI-84_Plus_graphing.jpg",
  "libro-calculo.jpg": "File:Calculus_textbook.jpg",
  "libro-fisica.jpg": "File:University_Physics_textbook.jpg",
  "libro-programacion.jpg": "File:Clean_Code_book.jpg",
  "multimetro-digital.jpg": "File:Digital_multimeter_Mastech_MAS830L.jpg",
  "kit-arduino.jpg": "File:Arduino_Uno_-_R3.jpg",
  "gafas-seguridad.jpg": "File:Safety_glasses.jpg",
  "adaptador-usbc.jpg": "File:USB_Type-C_hub.jpg",
  "cargador-laptop.jpg": "File:USB-C_power_adapter.jpg",
  "tableta-grafica.jpg": "File:Wacom_Intuos_graphics_tablet.jpg",
  "audifonos.jpg": "File:Headphones_1.jpg",
  "balon-futbol.jpg": "File:Soccer_ball.svg",
  "balon-baloncesto.jpg": "File:Basketball.png",
  "raqueta-tenis.jpg": "File:Tennis_racket_and_balls.jpg",
  "atril-lectura.jpg": "File:Music_stand.jpg",
  "regla-dibujo.jpg": "File:Set_square_and_ruler.jpg",
  "tripode.jpg": "File:Camera_tripod.jpg",
};

// Fallback por categoría si el File: exacto no existe
const CATEGORIAS_FALLBACK = {
  "bata-laboratorio.jpg": "Category:Lab coats",
  "calculadora-casio.jpg": "Category:Casio calculators",
  "calculadora-graficadora.jpg": "Category:Graphing calculators",
  "libro-calculo.jpg": "Category:Mathematics textbooks",
  "libro-fisica.jpg": "Category:Physics textbooks",
  "libro-programacion.jpg": "Category:Computer science books",
  "multimetro-digital.jpg": "Category:Digital multimeters",
  "kit-arduino.jpg": "Category:Arduino Uno",
  "gafas-seguridad.jpg": "Category:Safety glasses",
  "adaptador-usbc.jpg": "Category:USB hubs",
  "cargador-laptop.jpg": "Category:AC adapters",
  "tableta-grafica.jpg": "Category:Graphics tablets",
  "audifonos.jpg": "Category:Headphones",
  "balon-futbol.jpg": "Category:Association football balls",
  "balon-baloncesto.jpg": "Category:Basketballs",
  "raqueta-tenis.jpg": "Category:Tennis rackets",
  "atril-lectura.jpg": "Category:Music stands",
  "regla-dibujo.jpg": "Category:Set squares",
  "tripode.jpg": "Category:Tripods (photography)",
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

async function obtenerDeCategoria(nombreCategoria, nombreArchivo) {
  const url =
    "https://commons.wikimedia.org/w/api.php" +
    "?action=query" +
    "&list=categorymembers" +
    "&cmtitle=" + encodeURIComponent(nombreCategoria) +
    "&cmtype=file" +
    "&cmlimit=20" +
    "&format=json";

  const respuesta = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!respuesta.ok) throw new Error(`Wikimedia API respondió ${respuesta.status}`);
  const datos = await respuesta.json();
  const miembros = datos.query?.categorymembers;
  if (!miembros) return null;

  for (const miembro of miembros) {
    const titulo = miembro.title || "";
    if (contieneExcluido(titulo)) continue;

    // Intentar obtener info del archivo
    try {
      const info = await obtenerInfoFile(titulo);
      if (info && !info.missing) {
        return info;
      }
    } catch {
      continue;
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

  for (const [nombreArchivo, nombreFile] of Object.entries(ARCHIVOS_ESPECIFICOS)) {
    const destino = path.join(CARPETA_DESTINO, nombreArchivo);
    let exito = false;
    let ultimoError = "";

    try {
      console.log(`🔍 Consultando File: ${nombreFile}`);
      const info = await obtenerInfoFile(nombreFile);

      if (info && !info.missing) {
        console.log(`   ↳ ${info.titulo} | ${info.url} (${info.mime}, ${Math.round(info.tamaño / 1024)} KB)`);
        await descargarImagen(info.thumb, destino);
        const stats = fs.statSync(destino);
        console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
        resultados.push({ archivo: nombreArchivo, exito: true, tamaño: stats.size });
        exito = true;
      } else {
        ultimoError = `File: ${nombreFile} no existe o es missing`;
        console.warn(`   ⚠️  ${ultimoError}, probando categoría...`);

        const categoria = CATEGORIAS_FALLBACK[nombreArchivo];
        if (categoria) {
          const infoCat = await obtenerDeCategoria(categoria, nombreArchivo);
          if (infoCat && !infoCat.missing) {
            console.log(`   ↳ Categoría: ${infoCat.titulo} | ${infoCat.url} (${infoCat.mime}, ${Math.round(infoCat.tamaño / 1024)} KB)`);
            await descargarImagen(infoCat.thumb, destino);
            const stats = fs.statSync(destino);
            console.log(`   ✅ Guardado: ${nombreArchivo} (${Math.round(stats.size / 1024)} KB)`);
            resultados.push({ archivo: nombreArchivo, exito: true, tamaño: stats.size });
            exito = true;
          } else {
            ultimoError = `Categoría ${categoria} tampoco tuvo archivos válidos`;
          }
        }
      }
    } catch (error) {
      ultimoError = error.message;
      console.warn(`   ⚠️  Error: ${error.message}`);
    }

    if (!exito) {
      console.error(`❌ FALLO FINAL: ${nombreArchivo}: ${ultimoError}`);
      resultados.push({ archivo: nombreArchivo, exito: false, error: ultimoError });
    }
  }

  console.log("\n────────────────────────────────────────────");
  console.log("📊 RESUMEN DE DESCARGA (ARCHIVOS ESPECÍFICOS)");
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
}

main().catch((error) => {
  console.error("Error fatal:", error);
  process.exitCode = 1;
});
