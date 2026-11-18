import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export interface SolicitudCobro {
  monto: number;
  moneda: string;
  /** Identificador interno (pago o alquiler) para trazar la transacción. */
  referencia: string;
  /** Solo en sandbox: fuerza un rechazo para probar el flujo de error. */
  forzarFallo?: boolean;
}

export interface ResultadoCobro {
  exito: boolean;
  idTransaccion: string;
  estado: 'APROBADO' | 'RECHAZADO';
  codigoRespuesta: string;
  mensaje: string;
  fecha: Date;
}

export interface SolicitudPayout {
  monto: number;
  moneda: string;
  metodo: string;
  cuenta: string;
  referencia: string;
  forzarFallo?: boolean;
}

export interface ResultadoPayout {
  exito: boolean;
  idPayout: string;
  estado: 'PROCESADO' | 'RECHAZADO';
  codigoRespuesta: string;
  mensaje: string;
  fecha: Date;
}

/**
 * Pasarela de pagos simulada para el entorno Sandbox.
 *
 * No realiza cobros reales: genera identificadores con prefijo `sbx_` y
 * decide el resultado según `SANDBOX_TASA_EXITO` (0 a 1, por defecto 1).
 * Con `forzarFallo: true` siempre rechaza, lo que permite demostrar los
 * caminos de error sin modificar variables de entorno.
 *
 * En producción este servicio se reemplaza por el adaptador real
 * (Stripe, Wompi, Mercado Pago) manteniendo la misma interfaz.
 */
@Injectable()
export class ServicioPasarelaSandbox {
  private readonly logger = new Logger(ServicioPasarelaSandbox.name);

  private get tasaExito(): number {
    const valor = Number(process.env.SANDBOX_TASA_EXITO ?? '1');
    if (!Number.isFinite(valor)) return 1;
    return Math.min(1, Math.max(0, valor));
  }

  private get demoraMs(): number {
    const valor = Number(process.env.SANDBOX_DEMORA_MS ?? '0');
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  }

  private async simularLatencia(): Promise<void> {
    if (this.demoraMs === 0) return;
    await new Promise((resolver) => setTimeout(resolver, this.demoraMs));
  }

  private aprobar(forzarFallo?: boolean): boolean {
    if (forzarFallo) return false;
    return Math.random() < this.tasaExito;
  }

  /** Simula el cobro al arrendatario. */
  async cobrar(solicitud: SolicitudCobro): Promise<ResultadoCobro> {
    await this.simularLatencia();

    const aprobado = this.aprobar(solicitud.forzarFallo);
    const resultado: ResultadoCobro = {
      exito: aprobado,
      idTransaccion: `sbx_tx_${randomUUID()}`,
      estado: aprobado ? 'APROBADO' : 'RECHAZADO',
      codigoRespuesta: aprobado ? 'APROBADO' : 'TARJETA_RECHAZADA',
      mensaje: aprobado
        ? 'Pago aprobado por la pasarela sandbox.'
        : 'La pasarela sandbox rechazó el pago. Intenta con otro medio.',
      fecha: new Date(),
    };

    this.logger.log(
      `Cobro ${resultado.estado} ref=${solicitud.referencia} monto=${solicitud.monto} ${solicitud.moneda}`,
    );

    return resultado;
  }

  /** Simula la dispersión (payout) del dinero al propietario. */
  async dispersar(solicitud: SolicitudPayout): Promise<ResultadoPayout> {
    await this.simularLatencia();

    const aprobado = this.aprobar(solicitud.forzarFallo);
    const resultado: ResultadoPayout = {
      exito: aprobado,
      idPayout: `sbx_po_${randomUUID()}`,
      estado: aprobado ? 'PROCESADO' : 'RECHAZADO',
      codigoRespuesta: aprobado ? 'PROCESADO' : 'CUENTA_DESTINO_INVALIDA',
      mensaje: aprobado
        ? 'Dispersión procesada por la pasarela sandbox.'
        : 'La pasarela sandbox rechazó la dispersión a la cuenta destino.',
      fecha: new Date(),
    };

    this.logger.log(
      `Payout ${resultado.estado} ref=${solicitud.referencia} metodo=${solicitud.metodo} monto=${solicitud.monto}`,
    );

    return resultado;
  }
}
