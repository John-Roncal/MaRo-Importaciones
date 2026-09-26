import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/models';
import { ProductoService } from '../../../core/services/producto.service';
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import { AjusteStockDialogComponent } from '../ajuste-stock-dialog/ajuste-stock-dialog.component';
import { HistorialMovimientosDialogComponent } from '../historial-movimientos-dialog/historial-movimientos-dialog.component';
import { ImageLightboxComponent } from '../../../shared/image-lightbox/image-lightbox.component';

type EstadoStock = 'ok' | 'bajo' | 'agotado';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductoFormComponent, AjusteStockDialogComponent, HistorialMovimientosDialogComponent, ImageLightboxComponent],
  templateUrl: './producto-list.component.html',
  styleUrl: './producto-list.component.scss'
})
export class ProductoListComponent implements OnInit {
  productos: Producto[] = [];
  cargando = true;
  error = '';
  busqueda = '';

  mostrarFormulario = false;
  productoSeleccionado: Producto | null = null;

  mostrarAjuste = false;
  productoParaAjuste: Producto | null = null;

  mostrarHistorial = false;
  productoParaHistorial: Producto | null = null;

  imagenAmpliada: string | null = null;

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.error = '';
    try {
      this.productos = await this.productoService.listar();
    } catch {
      this.error = 'No se pudo cargar el inventario. Revisa tu conexión e intenta de nuevo.';
    } finally {
      this.cargando = false;
    }
  }

  get productosFiltrados(): Producto[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.productos;
    return this.productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo_barras ?? '').toLowerCase().includes(q)
    );
  }

  estadoStock(p: Producto): EstadoStock {
    const stock = p.stock_actual ?? 0;
    if (stock <= 0) return 'agotado';
    if (stock <= p.stock_minimo) return 'bajo';
    return 'ok';
  }

  etiquetaEstado(estado: EstadoStock): string {
    return { ok: 'En stock', bajo: 'Stock bajo', agotado: 'Agotado' }[estado];
  }

  abrirNuevo() {
    this.productoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  abrirEdicion(p: Producto) {
    this.productoSeleccionado = p;
    this.mostrarFormulario = true;
  }

  abrirAjuste(p: Producto) {
    this.productoParaAjuste = p;
    this.mostrarAjuste = true;
  }

  abrirHistorial(p: Producto) {
    this.productoParaHistorial = p;
    this.mostrarHistorial = true;
  }

  verImagenAmpliada(p: Producto, event: Event) {
    event.stopPropagation();
    if (p.imagen_base64) this.imagenAmpliada = p.imagen_base64;
  }

  async eliminarProducto(p: Producto) {
    const confirmado = confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    try {
      await this.productoService.eliminar(p.id!);
      await this.cargar();
    } catch (e: any) {
      if (e?.message?.includes('ya tiene ventas registradas')) {
        const desactivar = confirm(
          `"${p.nombre}" ya tiene ventas registradas, así que no se puede eliminar sin perder ese historial.\n\n¿Quieres desactivarlo en su lugar? Dejará de aparecer en las listas, pero no se pierde ningún dato.`
        );
        if (desactivar) {
          try {
            await this.productoService.desactivar(p.id!);
            await this.cargar();
          } catch {
            this.error = 'No se pudo desactivar el producto.';
          }
        }
      } else {
        this.error = 'No se pudo eliminar el producto.';
      }
    }
  }

  onGuardado() {
    this.mostrarFormulario = false;
    this.cargar();
  }

  onAjusteAplicado() {
    this.mostrarAjuste = false;
    this.cargar();
  }
}