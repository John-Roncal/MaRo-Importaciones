import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sucursal } from '../../models/models';
import { SucursalService } from '../../core/services/sucursal.service';
import { redimensionarImagenABase64 } from '../../shared/utils/image-utils';

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
      sucursal.logo_base64 = await redimensionarImagenABase64(archivo, 300, 'image/png');
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
}