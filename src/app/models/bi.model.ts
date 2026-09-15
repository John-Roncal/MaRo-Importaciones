export interface Valorizacion {
  id: string;
  sucursal_id: string;
  nombre: string;
  stock_actual: number;
  precio_compra: number;
  precio_venta: number;
  valor_inversion: number;
  valor_venta_potencial: number;
  margen_porcentual: number;
}

export interface RentabilidadProducto {
  id: string;
  sucursal_id: string;
  nombre: string;
  stock_actual: number;
  precio_compra: number;
  precio_venta: number;
  unidades_vendidas: number;
  ingresos_totales: number;
  costo_total: number;
  ganancia_total: number;
}

export interface VentasProducto {
  producto_id: string;
  sucursal_id: string;
  unidades_30d: number;
  ingresos_30d: number;
}

export type ClaseAbc = 'A' | 'B' | 'C';

// Fila combinada que arma el componente para la tabla del dashboard
export interface FilaRentabilidad extends RentabilidadProducto {
  unidades_30d: number;
  ingresos_30d: number;
  clase: ClaseAbc;
  porcentajeAcumulado: number;
}