import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SucursalService } from './sucursal.service';
import { ItemCarrito, ResultadoVenta } from '../../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {

  constructor(
    private supabase: SupabaseService,
    private sucursalService: SucursalService
  ) {}

  // Llama a fn_registrar_venta: crea la venta, el detalle y descuenta
  // el stock de todos los productos en UNA sola transacción atómica,
  // ya asociada a la sucursal activa.
  async registrarVenta(items: ItemCarrito[]): Promise<ResultadoVenta> {
    const sucursalId = this.sucursalService.sucursalActivaId;
    if (!sucursalId) throw new Error('No hay ninguna sucursal seleccionada.');

    const payload = items.map(i => ({
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario
    }));

    const { data, error } = await this.supabase.client.rpc('fn_registrar_venta', {
      items: payload,
      p_sucursal_id: sucursalId
    });
    if (error) throw error;
    return data[0] as ResultadoVenta;
  }
}