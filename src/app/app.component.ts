import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SucursalService } from './core/services/sucursal.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'MaRoImportacion';
  menuAbierto = false;

  constructor(
    public authService: AuthService,
    public sucursalService: SucursalService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.estaAutenticado && this.sucursalService.sucursales.length === 0) {
      this.sucursalService.cargarSucursales();
    }
  }

  cambiarSucursal(id: string) {
    this.cerrarMenu();
    this.sucursalService.establecerSucursalActiva(id);
    window.location.reload();
  }

  alternarMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape() {
    this.cerrarMenu();
  }

  async salir() {
    this.cerrarMenu();
    await this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
