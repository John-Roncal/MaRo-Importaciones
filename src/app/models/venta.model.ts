import { Producto } from './models';

export interface Venta {
  id?: string;
  sucursal_id?: string;
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

// Fila de detalle con el nombre del producto ya incluido (join con productos)
export interface DetalleVentaConProducto extends DetalleVenta {
  productos: { nombre: string } | null;
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