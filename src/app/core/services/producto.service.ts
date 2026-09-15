import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SucursalService } from './sucursal.service';
import { Producto } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {

  constructor(
    private supabase: SupabaseService,
    private sucursalService: SucursalService
  ) {}

  private get sucursalId(): string {
    const id = this.sucursalService.sucursalActivaId;
    if (!id) throw new Error('No hay ninguna sucursal seleccionada.');
    return id;
  }

  async listar(soloActivos = true): Promise<Producto[]> {
    let query = this.supabase.client
      .from('productos')
      .select('*')
      .eq('sucursal_id', this.sucursalId)
      .order('nombre');
    if (soloActivos) query = query.eq('activo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as Producto[];
  }

  async buscarPorCodigoBarras(codigo: string): Promise<Producto | null> {
    const { data, error } = await this.supabase.client
      .from('productos')
      .select('*')
      .eq('sucursal_id', this.sucursalId)
      .eq('codigo_barras', codigo)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async crear(producto: Producto): Promise<Producto> {
    // stock_actual nace en 0; el stock inicial se carga como un movimiento INGRESO
    const { data, error } = await this.supabase.client
      .from('productos')
      .insert({ ...producto, sucursal_id: this.sucursalId, stock_actual: 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id: string, cambios: Partial<Producto>): Promise<Producto> {
    // Nunca incluir stock_actual ni sucursal_id aquí: no se editan por esta vía
    const { stock_actual, sucursal_id, ...resto } = cambios;
    const { data, error } = await this.supabase.client
      .from('productos')
      .update(resto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async desactivar(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('productos')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  }
}