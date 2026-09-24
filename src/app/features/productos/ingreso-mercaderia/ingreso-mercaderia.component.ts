import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/models';
import { ProductoService } from '../../../core/services/producto.service';
import { IngresoService } from '../../../core/services/ingreso.service';
import { BarcodeScannerComponent } from '../../../shared/barcode-scanner/barcode-scanner.component';

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-ingreso-mercaderia',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  templateUrl: './ingreso-mercaderia.component.html',
  styleUrl: './ingreso-mercaderia.component.scss'
})
export class IngresoMercaderiaComponent implements OnInit {
  productos: Producto[] = [];
  busqueda = '';
  productoSeleccionado: Producto | null = null;

  cantidad: number | null = null;
  fechaIngreso = hoyIso();
  fechaVencimiento = '';
  precioCompra: number | null = null;

  mostrarScanner = false;
  cargandoCatalogo = true;
  guardando = false;
  error = '';
  exito = '';

  constructor(
    private productoService: ProductoService,
    private ingresoService: IngresoService
  ) {}

  ngOnInit() {
    this.cargarCatalogo();
  }

  async cargarCatalogo() {
    this.cargandoCatalogo = true;
    try {
      this.productos = await this.productoService.listar();
    } catch {
      this.error = 'No se pudo cargar el catálogo de productos.';
    } finally {
      this.cargandoCatalogo = false;
    }
  }

  get resultados(): Producto[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return [];
    return this.productos
      .filter(p => p.nombre.toLowerCase().includes(q) || (p.codigo_barras ?? '').toLowerCase().includes(q))
      .slice(0, 8);
  }

  seleccionarProducto(p: Producto) {
    this.productoSeleccionado = p;
    this.precioCompra = p.precio_compra;
    this.busqueda = '';
    this.error = '';
  }

  quitarSeleccion() {
    this.productoSeleccionado = null;
  }

  // El escaneo es la forma rápida de ubicar el producto durante la
  // recepción física de mercadería, sin tener que escribir su nombre.
  abrirScanner() {
    this.mostrarScanner = true;
  }

  onCodigoDetectado(codigo: string) {
    this.mostrarScanner = false;
    const producto = this.productos.find(p => p.codigo_barras === codigo);
    if (!producto) {
      this.error = `No se encontró ningún producto con el código ${codigo}.`;
      return;
    }
    this.seleccionarProducto(producto);
  }

  async registrar() {
    if (!this.productoSeleccionado) {
      this.error = 'Selecciona un producto primero.';
      return;
    }
    if (!this.cantidad || this.cantidad <= 0) {
      this.error = 'Ingresa una cantidad mayor a 0.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.exito = '';
    try {
      await this.ingresoService.registrar({
        producto_id: this.productoSeleccionado.id!,
        cantidad: this.cantidad,
        fecha_ingreso: this.fechaIngreso,
        fecha_vencimiento: this.fechaVencimiento || null,
        precio_compra: this.precioCompra ?? this.productoSeleccionado.precio_compra
      });

      this.exito = `Se registraron ${this.cantidad} ${this.productoSeleccionado.unidad_medida} de "${this.productoSeleccionado.nombre}".`;

      // Se deja el mismo producto seleccionado y solo se limpian cantidad/
      // vencimiento -- es común recibir varios lotes distintos del mismo
      // producto en una sola entrega (cajas con vencimientos diferentes).
      this.cantidad = null;
      this.fechaVencimiento = '';

      await this.cargarCatalogo();
      const actualizado = this.productos.find(p => p.id === this.productoSeleccionado?.id);
      if (actualizado) this.productoSeleccionado = actualizado;
    } catch {
      this.error = 'No se pudo registrar el ingreso. Intenta de nuevo.';
    } finally {
      this.guardando = false;
    }
  }
}