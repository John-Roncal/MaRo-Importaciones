import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { SucursalService } from './core/services/sucursal.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const sucursalService = inject(SucursalService);

      await authService.inicializar();
      if (authService.estaAutenticado) {
        await sucursalService.cargarSucursales();
      }
    })
  ]
};