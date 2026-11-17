import { SetMetadata } from '@nestjs/common';

export const CLAVE_RUTA_PUBLICA = 'rutaPublica';

/** Marca una ruta o controlador como accesible sin token JWT. */
export const Publico = () => SetMetadata(CLAVE_RUTA_PUBLICA, true);
