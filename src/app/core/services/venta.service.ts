import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ResultadoVenta, ItemCarrito } from '../../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {

  constructor(private supabase: SupabaseService) {}

  // Llama a fn_registrar_venta: crea la venta, el detalle y descuenta
  // el stock de todos los productos en UNA sola transacción atómica.
  async registrarVenta(items: ItemCarrito[]): Promise<ResultadoVenta> {
    const payload = items.map(i => ({
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario
    }));

    const { data, error } = await this.supabase.client.rpc('fn_registrar_venta', { items: payload });
    if (error) throw error;
    return data[0] as ResultadoVenta;
  }
}