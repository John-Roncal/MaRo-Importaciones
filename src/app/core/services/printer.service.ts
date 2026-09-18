import { Injectable } from '@angular/core';
import { SucursalService } from './sucursal.service';
import { ResultadoVenta, ItemCarrito } from '../../models/venta.model';

// UUIDs confirmados en pruebas reales con la impresora BT-582 (se identifica
// como "MPT-II" por Bluetooth). Usan el servicio UART transparente
// ISSC/Microchip, muy común en impresoras térmicas portátiles BLE genéricas.
const SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

const ANCHO_TICKET = 32;   // columnas de texto para papel de 58mm a fuente normal
const ANCHO_LOGO_DOTS = 200; // ancho del logo impreso, en puntos (dots)

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(private sucursalService: SucursalService) {}

  get conectada(): boolean {
    return !!this.device?.gatt?.connected;
  }

  get nombreDispositivo(): string {
    return this.device?.name ?? '';
  }

  // Debe llamarse directo desde un click del usuario (requisito de Web Bluetooth).
  async conectar(): Promise<void> {
    this.device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    await this.asegurarConexionGatt();
  }

  private async asegurarConexionGatt(): Promise<void> {
    if (!this.device) {
      throw new Error('No hay ninguna impresora emparejada. Usa "Conectar impresora" primero.');
    }
    if (!this.device.gatt) {
      throw new Error('Este dispositivo no soporta GATT.');
    }
    if (!this.device.gatt.connected) {
      await this.device.gatt.connect();
    }
    const servicio = await this.device.gatt.getPrimaryService(SERVICE_UUID);
    this.characteristic = await servicio.getCharacteristic(CHARACTERISTIC_UUID);
  }

  desconectar() {
    this.device?.gatt?.disconnect();
    this.characteristic = null;
  }

  async imprimirTicket(venta: ResultadoVenta, items: ItemCarrito[]): Promise<void> {
    if (!this.conectada) {
      await this.conectar();
    } else if (!this.characteristic) {
      await this.asegurarConexionGatt();
    }

    const sucursal = this.sucursalService.sucursalActiva;
    const nombreComercial = sucursal?.nombre_comercial ?? 'Mi Negocio';

    const bytes = await this.construirTicket(venta, items, nombreComercial, sucursal?.logo_base64 ?? null);
    await this.enviarBytes(bytes);
  }

  // ---------- Construcción del ticket en ESC/POS ----------

  private async construirTicket(
    venta: ResultadoVenta,
    items: ItemCarrito[],
    negocio: string,
    logoBase64: string | null
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const init = new Uint8Array([0x1b, 0x40]); // ESC @ : inicializar impresora

    let logoBytes = new Uint8Array(0);
    if (logoBase64) {
      try {
        logoBytes = await this.construirLogoBytes(logoBase64);
      } catch {
        // si el logo falla por cualquier motivo, se imprime el ticket sin él
        // en vez de bloquear la venta completa
        logoBytes = new Uint8Array(0);
      }
    }

    let texto = '';
    texto += this.centrar(this.sinAcentos(negocio.toUpperCase())) + '\n';
    texto += this.centrar('Ticket de venta') + '\n';
    texto += this.lineaSimple();
    texto += `Fecha: ${this.formatearFecha(venta.fecha_hora)}\n`;
    texto += `Venta: ${venta.venta_id.slice(0, 8)}\n`;
    texto += this.lineaSimple();

    for (const item of items) {
      texto += this.sinAcentos(this.truncar(item.producto.nombre, ANCHO_TICKET)) + '\n';
      const detalle = `  ${item.cantidad} x S/ ${item.precio_unitario.toFixed(2)}`;
      const subtotal = `S/ ${(item.cantidad * item.precio_unitario).toFixed(2)}`;
      texto += this.dosColumnas(detalle, subtotal) + '\n';
    }

    texto += this.lineaSimple();
    texto += this.dosColumnas('TOTAL', `S/ ${venta.total.toFixed(2)}`) + '\n';
    texto += this.lineaSimple();
    texto += this.centrar('Gracias por su compra') + '\n';
    texto += '\n\n\n'; // espacio para poder cortar/rasgar el papel a mano

    const cuerpo = encoder.encode(texto);
    return new Uint8Array([...init, ...logoBytes, ...cuerpo]);
  }

  // Convierte el logo (PNG/JPG en base64) a formato ráster ESC/POS
  // (GS v 0): blanco/negro puro, empaquetado 8 píxeles por byte.
  private construirLogoBytes(dataUrl: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const anchoBytes = Math.ceil(ANCHO_LOGO_DOTS / 8);
        const anchoFinal = anchoBytes * 8;
        const alto = Math.max(1, Math.round(img.height * (anchoFinal / img.width)));

        const canvas = document.createElement('canvas');
        canvas.width = anchoFinal;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar el logo'));
          return;
        }
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, anchoFinal, alto);
        ctx.drawImage(img, 0, 0, anchoFinal, alto);

        const { data } = ctx.getImageData(0, 0, anchoFinal, alto);
        const bitmap = new Uint8Array(anchoBytes * alto);

        for (let y = 0; y < alto; y++) {
          for (let x = 0; x < anchoFinal; x++) {
            const i = (y * anchoFinal + x) * 4;
            const luminancia = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const esNegro = luminancia < 160; // umbral simple blanco/negro
            if (esNegro) {
              const byteIndex = y * anchoBytes + Math.floor(x / 8);
              bitmap[byteIndex] |= 0x80 >> (x % 8);
            }
          }
        }

        const xL = anchoBytes & 0xff;
        const xH = (anchoBytes >> 8) & 0xff;
        const yL = alto & 0xff;
        const yH = (alto >> 8) & 0xff;

        // GS v 0: comando estándar ESC/POS de imagen ráster
        const encabezado = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        resolve(new Uint8Array([...encabezado, ...bitmap, 0x0a])); // salto de línea después del logo
      };
      img.onerror = () => reject(new Error('No se pudo cargar el logo'));
      img.src = dataUrl;
    });
  }

  private centrar(texto: string): string {
    if (texto.length >= ANCHO_TICKET) return texto.slice(0, ANCHO_TICKET);
    const espacios = ANCHO_TICKET - texto.length;
    const izquierda = Math.floor(espacios / 2);
    return ' '.repeat(izquierda) + texto;
  }

  private dosColumnas(izquierda: string, derecha: string): string {
    const espacio = ANCHO_TICKET - izquierda.length - derecha.length;
    if (espacio < 1) {
      return izquierda.slice(0, ANCHO_TICKET - derecha.length - 1) + ' ' + derecha;
    }
    return izquierda + ' '.repeat(espacio) + derecha;
  }

  private lineaSimple(): string {
    return '-'.repeat(ANCHO_TICKET) + '\n';
  }

  private truncar(texto: string, largo: number): string {
    return texto.length > largo ? texto.slice(0, largo) : texto;
  }

  private sinAcentos(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N');
  }

  private formatearFecha(iso: string): string {
    const fecha = new Date(iso);
    return fecha.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  }

  // ---------- Envío por Bluetooth ----------

  private async enviarBytes(payload: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('No se pudo obtener la característica de impresión.');
    }
    const chunkSize = 20; // MTU conservador para BLE
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
}