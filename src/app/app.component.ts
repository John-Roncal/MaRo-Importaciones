import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SucursalService } from './core/services/sucursal.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'MaRoImportacion';

  constructor(public sucursalService: SucursalService) {}

  ngOnInit() {
    // Ya se cargaron en el arranque de la app (ver app.config.ts),
    // esto solo asegura tener el listado disponible para el selector.
    if (this.sucursalService.sucursales.length === 0) {
      this.sucursalService.cargarSucursales();
    }
  }

  cambiarSucursal(id: string) {
    this.sucursalService.establecerSucursalActiva(id);
    // Recarga completa para que todos los componentes ya cargados
    // vuelvan a pedir sus datos con la nueva sucursal activa.
    window.location.reload();
  }
}