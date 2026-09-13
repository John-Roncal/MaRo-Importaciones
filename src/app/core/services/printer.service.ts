import { Injectable } from '@angular/core';
import { ResultadoVenta, ItemCarrito } from '../../models/venta.model';

// UUIDs confirmados en pruebas reales con la impresora BT-582 (se identifica
// como "MPT-II" por Bluetooth). Usan el servicio UART transparente
// ISSC/Microchip, muy común en impresoras térmicas portátiles BLE genéricas.
const SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

const ANCHO_TICKET = 32; // columnas de texto para papel de 58mm a fuente normal

@Injectable({ providedIn: 'root' })
export class PrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

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

  async imprimirTicket(venta: ResultadoVenta, items: ItemCarrito[], negocio = 'MaRoImportación'): Promise<void> {
    if (!this.conectada) {
      await this.conectar();
    } else if (!this.characteristic) {
      await this.asegurarConexionGatt();
    }

    const bytes = this.construirTicket(venta, items, negocio);
    await this.enviarBytes(bytes);
  }

  // ---------- Construcción del ticket en ESC/POS ----------

  private construirTicket(venta: ResultadoVenta, items: ItemCarrito[], negocio: string): Uint8Array {
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

    const encoder = new TextEncoder();
    const init = new Uint8Array([0x1b, 0x40]); // ESC @ : inicializar impresora
    const cuerpo = encoder.encode(texto);
    return new Uint8Array([...init, ...cuerpo]);
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
      // si no entra, se corta el texto de la izquierda para no romper la alineación
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

  // Las impresoras térmicas baratas suelen usar CP437/850 y no interpretan
  // bien tildes/ñ en UTF-8 crudo; se reemplazan por su equivalente sin acento.
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