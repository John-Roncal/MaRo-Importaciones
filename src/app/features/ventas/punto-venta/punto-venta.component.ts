import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/models';
import { ItemCarrito, ResultadoVenta } from '../../../models/venta.model';
import { ProductoService } from '../../../core/services/producto.service';
import { VentaService } from '../../../core/services/venta.service';
import { BarcodeScannerComponent } from '../../../shared/barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  templateUrl: './punto-venta.component.html',
  styleUrl: './punto-venta.component.scss'
})
export class PuntoVentaComponent implements OnInit {
  productos: Producto[] = [];
  busqueda = '';
  carrito: ItemCarrito[] = [];

  mostrarScanner = false;

  cargando = true;
  error = '';

  procesando = false;
  errorVenta = '';
  ventaConfirmada: ResultadoVenta | null = null;

  constructor(
    private productoService: ProductoService,
    private ventaService: VentaService
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  async cargarProductos() {
    this.cargando = true;
    this.error = '';
    try {
      this.productos = await this.productoService.listar();
    } catch {
      this.error = 'No se pudo cargar el catálogo de productos.';
    } finally {
      this.cargando = false;
    }
  }

  get resultados(): Producto[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return [];
    return this.productos
      .filter(p => p.nombre.toLowerCase().includes(q) || (p.codigo_barras ?? '').toLowerCase().includes(q))
      .slice(0, 8);
  }

  get total(): number {
    return this.carrito.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);
  }

  agregarAlCarrito(producto: Producto) {
    const existente = this.carrito.find(i => i.producto.id === producto.id);
    const enCarrito = existente?.cantidad ?? 0;
    if (enCarrito + 1 > (producto.stock_actual ?? 0)) {
      this.errorVenta = `No hay suficiente stock de "${producto.nombre}".`;
      return;
    }
    this.errorVenta = '';
    if (existente) {
      existente.cantidad++;
    } else {
      // precio_unitario nace igual al precio de catálogo; el vendedor
      // puede editarlo después según lo que negocie con el cliente.
      this.carrito.push({ producto, cantidad: 1, precio_unitario: producto.precio_venta });
    }
    this.busqueda = '';
  }

  actualizarPrecio(item: ItemCarrito, valor: number) {
    item.precio_unitario = valor >= 0 ? valor : 0;
  }

  precioPorDebajoCosto(item: ItemCarrito): boolean {
    return item.precio_unitario < item.producto.precio_compra;
  }

  abrirScanner() {
    this.mostrarScanner = true;
  }

  onCodigoDetectado(codigo: string) {
    this.mostrarScanner = false;
    const producto = this.productos.find(p => p.codigo_barras === codigo);
    if (!producto) {
      this.errorVenta = `No se encontró ningún producto con el código ${codigo}.`;
      return;
    }
    this.agregarAlCarrito(producto);
  }

  cambiarCantidad(item: ItemCarrito, delta: number) {
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad <= 0) {
      this.quitarDelCarrito(item);
      return;
    }
    if (nuevaCantidad > (item.producto.stock_actual ?? 0)) {
      this.errorVenta = `No hay suficiente stock de "${item.producto.nombre}".`;
      return;
    }
    this.errorVenta = '';
    item.cantidad = nuevaCantidad;
  }

  quitarDelCarrito(item: ItemCarrito) {
    this.carrito = this.carrito.filter(i => i !== item);
  }

  async cobrar() {
    if (this.carrito.length === 0) return;
    this.procesando = true;
    this.errorVenta = '';
    try {
      this.ventaConfirmada = await this.ventaService.registrarVenta(this.carrito);
      this.carrito = [];
      await this.cargarProductos(); // refresca stock ya descontado
    } catch (e: any) {
      this.errorVenta = e?.message?.includes('Stock insuficiente')
        ? 'El stock cambió y ya no alcanza para completar la venta. Revisa el carrito.'
        : 'No se pudo procesar la venta. Intenta de nuevo.';
    } finally {
      this.procesando = false;
    }
  }

  nuevaVenta() {
    this.ventaConfirmada = null;
  }
}