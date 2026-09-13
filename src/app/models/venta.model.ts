import { Producto } from './models';

export interface Venta {
  id?: string;
  fecha_hora?: string;
  total: number;
  estado?: string;
}

export interface DetalleVenta {
  id?: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  // Precio al que se vende ESTE item en ESTA venta. Nace igual al
  // precio_venta del catálogo, pero el vendedor puede editarlo
  // (negociación con el cliente, descuento puntual, etc.).
  precio_unitario: number;
}

export interface ResultadoVenta {
  venta_id: string;
  total: number;
  fecha_hora: string;
}