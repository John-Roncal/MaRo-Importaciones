import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SucursalService } from './sucursal.service';
import { Valorizacion, RentabilidadProducto, VentasProducto, LoteSeguimiento } from '../../models/bi.model';

@Injectable({ providedIn: 'root' })
export class BiService {

  constructor(
    private supabase: SupabaseService,
    private sucursalService: SucursalService
  ) {}

  private get sucursalId(): string {
    const id = this.sucursalService.sucursalActivaId;
    if (!id) throw new Error('No hay ninguna sucursal seleccionada.');
    return id;
  }

  async obtenerValorizacion(): Promise<Valorizacion[]> {
    const { data, error } = await this.supabase.client
      .from('v_valorizacion_productos')
      .select('*')
      .eq('sucursal_id', this.sucursalId);
    if (error) throw error;
    return data as Valorizacion[];
  }

  async obtenerRentabilidad(): Promise<RentabilidadProducto[]> {
    const { data, error } = await this.supabase.client
      .from('v_rentabilidad_por_producto')
      .select('*')
      .eq('sucursal_id', this.sucursalId);
    if (error) throw error;
    return data as RentabilidadProducto[];
  }

  async obtenerVentas30Dias(): Promise<VentasProducto[]> {
    const { data, error } = await this.supabase.client
      .from('v_ventas_30_dias')
      .select('*')
      .eq('sucursal_id', this.sucursalId);
    if (error) throw error;
    return data as VentasProducto[];
  }

  async obtenerLotesSeguimiento(): Promise<LoteSeguimiento[]> {
    const { data, error } = await this.supabase.client
      .from('v_lotes_seguimiento')
      .select('*')
      .eq('sucursal_id', this.sucursalId);
    if (error) throw error;
    return data as LoteSeguimiento[];
  }
}