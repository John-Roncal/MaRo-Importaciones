import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SucursalService } from './sucursal.service';
import { Venta, DetalleVentaConProducto } from '../../models/venta.model';

@Injectable({ providedIn: 'root' })
export class HistorialVentasService {

  constructor(
    private supabase: SupabaseService,
    private sucursalService: SucursalService
  ) {}

  private get sucursalId(): string {
    const id = this.sucursalService.sucursalActivaId;
    if (!id) throw new Error('No hay ninguna sucursal seleccionada.');
    return id;
  }

  // desde/hasta en formato 'YYYY-MM-DD'. 'hasta' se extiende al final del
  // día para incluir todas las ventas de esa fecha, no solo hasta las 00:00.
  async listarPorRango(desde: string, hasta: string): Promise<Venta[]> {
    const hastaFinDia = `${hasta}T23:59:59`;
    const { data, error } = await this.supabase.client
      .from('ventas')
      .select('*')
      .eq('sucursal_id', this.sucursalId)
      .gte('fecha_hora', `${desde}T00:00:00`)
      .lte('fecha_hora', hastaFinDia)
      .order('fecha_hora', { ascending: false });
    if (error) throw error;
    return data as Venta[];
  }

  async obtenerDetalle(ventaId: string): Promise<DetalleVentaConProducto[]> {
    const { data, error } = await this.supabase.client
      .from('detalle_venta')
      .select('*, productos(nombre)')
      .eq('venta_id', ventaId);
    if (error) throw error;
    return data as unknown as DetalleVentaConProducto[];
  }

  async editarItem(detalleId: string, cantidad: number, precioUnitario: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('fn_editar_item_venta', {
      p_detalle_id: detalleId,
      p_nueva_cantidad: cantidad,
      p_nuevo_precio: precioUnitario
    });
    if (error) {
      if (error.message?.includes('Stock insuficiente')) {
        throw new Error('No hay stock suficiente para aumentar la cantidad de este producto.');
      }
      throw new Error('No se pudo editar el item de la venta.');
    }
  }

  async anularVenta(ventaId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('fn_anular_venta', { p_venta_id: ventaId });
    if (error) throw new Error('No se pudo anular la venta.');
  }
}