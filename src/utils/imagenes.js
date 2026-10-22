/**
 * @file imagenes.js
 * Utilidades para leer, validar y comprimir imágenes en el navegador.
 * Se usan en el perfil y en la publicación de artículos: en el celular el
 * usuario puede tomar la foto o elegirla de la galería y se guarda como
 * data URL (JPEG comprimido) para enviarla al backend.
 */

/** Tamaño máximo del archivo original (MB). */
export const MAX_FOTO_MB = 15;

/** Lee un archivo del input como data URL. */
export const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(archivo);
  });

/**
 * Redimensiona y comprime una imagen a JPEG.
 * @param {string} dataUrl Imagen original como data URL.
 * @param {{ maxSize?: number, quality?: number }} opciones
 * @returns {Promise<string>} Data URL comprimida.
 */
export const comprimirImagen = (
  dataUrl,
  { maxSize = 320, quality = 0.85 } = {}
) =>
  new Promise((resolve, reject) => {
    const imagen = new window.Image();
    imagen.onload = () => {
      const escala = Math.min(
        1,
        maxSize / Math.max(imagen.width, imagen.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagen.width * escala));
      canvas.height = Math.max(1, Math.round(imagen.height * escala));
      const contexto = canvas.getContext("2d");
      if (!contexto) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    imagen.onerror = () =>
      reject(new Error("El archivo no es una imagen válida"));
    imagen.src = dataUrl;
  });

/**
 * Procesa un archivo de imagen: valida tipo/tamaño y devuelve la data URL
 * comprimida lista para guardar.
 */
export const procesarArchivoImagen = async (
  archivo,
  opciones = {}
) => {
  if (!archivo) return null;
  if (!archivo.type.startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen (JPG, PNG o WEBP)");
  }
  if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
    throw new Error(`La imagen no puede superar los ${MAX_FOTO_MB} MB`);
  }
  const dataUrl = await leerArchivoComoDataUrl(archivo);
  return comprimirImagen(dataUrl, opciones);
};
