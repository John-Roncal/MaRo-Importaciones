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

  // Ahora sale por FEFO/FIFO de un lote real (ver fn_registrar_salida_manual),
  // en vez de insertar el movimiento directo -- así nunca se desalinea
  // productos.stock_actual con la suma real de los lotes.
  async registrarSalida(productoId: string, cantidad: number, motivo = 'merma'): Promise<void> {
    const { error } = await this.supabase.client.rpc('fn_registrar_salida_manual', {
      p_producto_id: productoId,
      p_cantidad: cantidad,
      p_motivo: motivo
    });
    if (error) {
      if (error.message?.includes('Stock insuficiente')) {
        throw new Error('No hay suficiente stock para esta salida.');
      }
      throw new Error('No se pudo registrar la salida.');
    }
  }

  // El ajuste por conteo físico solo se permite si el producto tiene un
  // único lote activo (ver fn_registrar_ajuste_manual); si tiene varios,
  // la función rechaza el ajuste con un mensaje claro.
  async registrarAjuste(productoId: string, nuevoStock: number, motivo = 'conteo_fisico'): Promise<void> {
    const { error } = await this.supabase.client.rpc('fn_registrar_ajuste_manual', {
      p_producto_id: productoId,
      p_nuevo_stock: nuevoStock,
      p_motivo: motivo
    });
    if (error) {
      if (error.message?.includes('más de un lote activo')) {
        throw new Error('Este producto tiene varios lotes activos; el ajuste manual no puede elegir cuál corregir todavía.');
      }
      throw new Error('No se pudo registrar el ajuste.');
    }
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