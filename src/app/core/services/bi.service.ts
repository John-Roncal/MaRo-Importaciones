import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SucursalService } from './sucursal.service';
import { Valorizacion, RentabilidadProducto, VentasProducto, LoteSeguimiento, VentaDiaria } from '../../models/bi.model';

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

  // desde/hasta en formato 'YYYY-MM-DD'. Trae los datos diarios dentro del
  // rango; el agrupamiento en semana/mes lo hace el componente.
  async obtenerVentasDiarias(desde: string, hasta: string): Promise<VentaDiaria[]> {
    const { data, error } = await this.supabase.client
      .from('v_ventas_diarias')
      .select('*')
      .eq('sucursal_id', this.sucursalId)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true });
    if (error) throw error;
    return data as VentaDiaria[];
  }
}