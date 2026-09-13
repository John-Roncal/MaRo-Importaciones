import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Producto } from '../../models/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {

  constructor(private supabase: SupabaseService) {}

  async listar(soloActivos = true): Promise<Producto[]> {
    let query = this.supabase.client.from('productos').select('*').order('nombre');
    if (soloActivos) query = query.eq('activo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as Producto[];
  }

  async buscarPorCodigoBarras(codigo: string): Promise<Producto | null> {
    const { data, error } = await this.supabase.client
      .from('productos')
      .select('*')
      .eq('codigo_barras', codigo)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async crear(producto: Producto): Promise<Producto> {
    // stock_actual nace en 0; el stock inicial se carga como un movimiento INGRESO
    const { data, error } = await this.supabase.client
      .from('productos')
      .insert({ ...producto, stock_actual: 0 })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id: string, cambios: Partial<Producto>): Promise<Producto> {
    // Nunca incluir stock_actual aquí: eso solo lo toca movimientos_inventario
    const { stock_actual, ...resto } = cambios;
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