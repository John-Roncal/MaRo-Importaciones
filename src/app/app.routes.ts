import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'inventario',
    loadComponent: () =>
      import('./features/productos/producto-list/producto-list.component').then(
        m => m.ProductoListComponent
      )
  },
  {
    path: 'vender',
    loadComponent: () =>
      import('./features/ventas/punto-venta/punto-venta.component').then(
        m => m.PuntoVentaComponent
      )
  },
  { path: '', redirectTo: 'vender', pathMatch: 'full' },
  { path: '**', redirectTo: 'vender' }
];