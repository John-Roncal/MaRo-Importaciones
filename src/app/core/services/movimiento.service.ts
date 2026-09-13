import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MovimientoInventario } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class MovimientoService {

  constructor(private supabase: SupabaseService) {}

  // Toda alta de stock, venta o ajuste pasa por aquí. El trigger de la BD
  // se encarga de actualizar productos.stock_actual y de rechazar stock negativo.
  async registrar(mov: MovimientoInventario): Promise<MovimientoInventario> {
    const { data, error } = await this.supabase.client
      .from('movimientos_inventario')
      .insert(mov)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  registrarIngreso(productoId: string, cantidad: number, motivo = 'compra') {
    return this.registrar({ producto_id: productoId, tipo: 'INGRESO', cantidad, motivo });
  }

  registrarSalida(productoId: string, cantidad: number, motivo = 'venta') {
    return this.registrar({ producto_id: productoId, tipo: 'SALIDA', cantidad, motivo });
  }

  registrarAjuste(productoId: string, nuevoStock: number, motivo = 'ajuste_manual') {
    return this.registrar({ producto_id: productoId, tipo: 'AJUSTE', cantidad: nuevoStock, motivo });
  }

  async historialPorProducto(productoId: string): Promise<MovimientoInventario[]> {
    const { data, error } = await this.supabase.client
      .from('movimientos_inventario')
      .select('*')
      .eq('producto_id', productoId)
      .order('fecha_hora', { ascending: false });
    if (error) throw error;
    return data as MovimientoInventario[];
  }
}