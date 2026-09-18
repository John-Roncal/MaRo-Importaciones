import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sucursal } from '../../models/models';
import { SucursalService } from '../../core/services/sucursal.service';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.scss'
})
export class SucursalesComponent {
  error = '';
  guardandoId: string | null = null;

  constructor(public sucursalService: SucursalService) {}

  async onLogoSeleccionado(event: Event, sucursal: Sucursal) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    try {
      sucursal.logo_base64 = await this.redimensionarImagen(archivo, 300);
    } catch {
      this.error = 'No se pudo procesar esa imagen. Prueba con otro archivo (PNG o JPG).';
    }
  }

  quitarLogo(sucursal: Sucursal) {
    sucursal.logo_base64 = null;
  }

  async guardar(sucursal: Sucursal) {
    this.guardandoId = sucursal.id!;
    this.error = '';
    try {
      await this.sucursalService.actualizar(sucursal.id!, {
        nombre_comercial: sucursal.nombre_comercial,
        logo_base64: sucursal.logo_base64
      });
    } catch {
      this.error = 'No se pudieron guardar los cambios.';
    } finally {
      this.guardandoId = null;
    }
  }

  // Redimensiona la imagen a un ancho máximo antes de guardarla — no hace
  // falta un logo enorme para un ticket de 58mm, y así no infla la base de datos.
  private redimensionarImagen(archivo: File, anchoMax: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        const img = new Image();
        img.onload = () => {
          const escala = Math.min(1, anchoMax / img.width);
          const ancho = Math.round(img.width * escala);
          const alto = Math.round(img.height * escala);
          const canvas = document.createElement('canvas');
          canvas.width = ancho;
          canvas.height = alto;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo procesar la imagen'));
            return;
          }
          ctx.drawImage(img, 0, 0, ancho, alto);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Imagen inválida'));
        img.src = lector.result as string;
      };
      lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
      lector.readAsDataURL(archivo);
    });
  }
}