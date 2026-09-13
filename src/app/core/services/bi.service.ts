import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Valorizacion, RentabilidadProducto, VentasProducto } from '../../models/bi.model';

@Injectable({ providedIn: 'root' })
export class BiService {

  constructor(private supabase: SupabaseService) {}

  async obtenerValorizacion(): Promise<Valorizacion[]> {
    const { data, error } = await this.supabase.client
      .from('v_valorizacion_productos')
      .select('*');
    if (error) throw error;
    return data as Valorizacion[];
  }

  async obtenerRentabilidad(): Promise<RentabilidadProducto[]> {
    const { data, error } = await this.supabase.client
      .from('v_rentabilidad_por_producto')
      .select('*');
    if (error) throw error;
    return data as RentabilidadProducto[];
  }

  async obtenerVentas30Dias(): Promise<VentasProducto[]> {
    const { data, error } = await this.supabase.client
      .from('v_ventas_30_dias')
      .select('*');
    if (error) throw error;
    return data as VentasProducto[];
  }
}