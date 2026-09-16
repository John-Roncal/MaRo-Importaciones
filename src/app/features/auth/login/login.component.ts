import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SucursalService } from '../../../core/services/sucursal.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private sucursalService: SucursalService,
    private router: Router
  ) {}

  async ingresar() {
    if (!this.email || !this.password) return;
    this.cargando = true;
    this.error = '';
    try {
      await this.authService.login(this.email, this.password);
      await this.sucursalService.cargarSucursales();
      this.router.navigateByUrl('/vender');
    } catch (e: any) {
      this.error = e?.message ?? 'No se pudo iniciar sesión.';
    } finally {
      this.cargando = false;
    }
  }
}