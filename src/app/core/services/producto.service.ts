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

  // Crea el producto y, si se indica cantidad, su primer lote -- en una
  // sola transacción en la base de datos (fn_crear_producto_con_lote).
  async crearConLote(datos: {
    nombre: string;
    codigo_barras: string | null;
    imagen_base64: string | null;
    precio_compra: number;
    precio_venta: number;
    stock_minimo: number;
    unidad_medida: string;
    cantidad_inicial: number | null;
    fecha_ingreso: string;
    fecha_vencimiento: string | null;
  }): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('fn_crear_producto_con_lote', {
      p_sucursal_id: this.sucursalId,
      p_nombre: datos.nombre,
      p_codigo_barras: datos.codigo_barras,
      p_imagen_base64: datos.imagen_base64,
      p_precio_compra: datos.precio_compra,
      p_precio_venta: datos.precio_venta,
      p_stock_minimo: datos.stock_minimo,
      p_unidad_medida: datos.unidad_medida,
      p_cantidad_inicial: datos.cantidad_inicial,
      p_fecha_ingreso: datos.fecha_ingreso,
      p_fecha_vencimiento: datos.fecha_vencimiento
    });
    if (error) throw new Error('No se pudo crear el producto.');
    return data as string;
  }

  async actualizar(id: string, cambios: Partial<Producto>): Promise<Producto> {
    // Nunca incluir stock_actual, sucursal_id ni precio_compra aquí: el
    // costo real vive en los lotes, no se edita desde el catálogo.
    const { stock_actual, sucursal_id, precio_compra, ...resto } = cambios;
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

  // Elimina de verdad el producto (y sus lotes/movimientos). Si ya tiene
  // ventas registradas, la función de la base de datos rechaza el borrado
  // -- en ese caso, el componente que llama esto debe ofrecer desactivar().
  async eliminar(id: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('fn_eliminar_producto', {
      p_producto_id: id
    });
    if (error) throw new Error(error.message);
  }
}