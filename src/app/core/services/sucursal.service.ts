import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Sucursal } from '../../models/models';

const CLAVE_STORAGE = 'sucursal_activa_id';

@Injectable({ providedIn: 'root' })
export class SucursalService {
  sucursales: Sucursal[] = [];

  constructor(private supabase: SupabaseService) {}

  // Se llama una vez al arrancar la app (ver app.config.ts) para que
  // cualquier componente que se cargue después ya tenga la sucursal lista.
  async cargarSucursales(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('sucursales')
      .select('*')
      .eq('activa', true)
      .order('nombre_comercial');

    if (error) throw error;
    this.sucursales = data as Sucursal[];

    const idGuardado = this.sucursalActivaId;
    const sigueExistiendo = this.sucursales.some(s => s.id === idGuardado);
    if ((!idGuardado || !sigueExistiendo) && this.sucursales.length > 0) {
      this.establecerSucursalActiva(this.sucursales[0].id!);
    }
  }

  get sucursalActivaId(): string | null {
    return localStorage.getItem(CLAVE_STORAGE);
  }

  get sucursalActiva(): Sucursal | undefined {
    return this.sucursales.find(s => s.id === this.sucursalActivaId);
  }

  establecerSucursalActiva(id: string) {
    localStorage.setItem(CLAVE_STORAGE, id);
  }
}