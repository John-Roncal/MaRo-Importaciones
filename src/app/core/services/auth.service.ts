import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type Rol = 'admin' | 'vendedor';

export interface Perfil {
  id: string;
  rol: Rol;
  sucursal_id: string | null; // null = admin, ve todas las sucursales
  nombre: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  perfil: Perfil | null = null;

  constructor(private supabase: SupabaseService) {}

  get estaAutenticado(): boolean {
    return !!this.perfil;
  }

  get esAdmin(): boolean {
    return this.perfil?.rol === 'admin';
  }

  // Se llama una sola vez, al arrancar la app (ver app.config.ts), para
  // restaurar la sesión si el usuario ya había iniciado sesión antes.
  async inicializar(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    if (data.session) {
      await this.cargarPerfil(data.session.user.id);
    }
  }

  private async cargarPerfil(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    this.perfil = error ? null : (data as Perfil);
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Correo o contraseña incorrectos.');

    await this.cargarPerfil(data.user.id);
    if (!this.perfil) {
      await this.supabase.client.auth.signOut();
      throw new Error('Tu usuario no tiene un perfil asignado. Contacta al administrador.');
    }
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.perfil = null;
  }
}