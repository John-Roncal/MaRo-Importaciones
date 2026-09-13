export interface Producto {
  id?: string;
  nombre: string;
  codigo_barras?: string | null;
  categoria_id?: string | null;
  precio_compra: number;
  precio_venta: number;
  stock_actual?: number;   // solo lectura: lo mantiene el trigger de la BD
  stock_minimo: number;
  unidad_medida: string;
  activo?: boolean;
  created_at?: string;
}

export type TipoMovimiento = 'INGRESO' | 'SALIDA' | 'AJUSTE';

export interface MovimientoInventario {
  id?: string;
  producto_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  venta_id?: string | null;
  fecha_hora?: string;
}