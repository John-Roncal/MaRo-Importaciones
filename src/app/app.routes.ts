import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        m => m.LoginComponent
      )
  },
  {
    path: 'inventario',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/productos/producto-list/producto-list.component').then(
        m => m.ProductoListComponent
      )
  },
  {
    path: 'ingreso-mercaderia',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/productos/ingreso-mercaderia/ingreso-mercaderia.component').then(
        m => m.IngresoMercaderiaComponent
      )
  },
  {
    path: 'vender',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ventas/punto-venta/punto-venta.component').then(
        m => m.PuntoVentaComponent
      )
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        m => m.DashboardComponent
      )
  },
  {
    path: 'historial-ventas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/ventas/historial-ventas/historial-ventas.component').then(
        m => m.HistorialVentasComponent
      )
  },
  {
    path: 'sucursales',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/sucursales/sucursales.component').then(
        m => m.SucursalesComponent
      )
  },
  { path: '', redirectTo: 'vender', pathMatch: 'full' },
  { path: '**', redirectTo: 'vender' }
];