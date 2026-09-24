import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DatosIngreso {
  producto_id: string;
  cantidad: number;
  fecha_ingreso: string;           // 'YYYY-MM-DD'
  fecha_vencimiento: string | null; // 'YYYY-MM-DD' o null si no aplica
  precio_compra: number;
}

@Injectable({ providedIn: 'root' })
export class IngresoService {

  constructor(private supabase: SupabaseService) {}

  async registrar(datos: DatosIngreso): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('fn_registrar_ingreso', {
      p_producto_id: datos.producto_id,
      p_cantidad: datos.cantidad,
      p_fecha_ingreso: datos.fecha_ingreso,
      p_fecha_vencimiento: datos.fecha_vencimiento,
      p_precio_compra: datos.precio_compra
    });
    if (error) throw new Error('No se pudo registrar el ingreso de mercadería.');
    return data as string; // id del lote creado
  }
}