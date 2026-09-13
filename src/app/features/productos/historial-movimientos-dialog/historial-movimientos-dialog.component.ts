import { Component, Input, OnChanges, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto, MovimientoInventario } from '../../../models/models';
import { MovimientoService } from '../../../core/services/movimiento.service';

@Component({
  selector: 'app-historial-movimientos-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-movimientos-dialog.component.html',
  styleUrl: './historial-movimientos-dialog.component.scss'
})
export class HistorialMovimientosDialogComponent implements OnChanges {
  @Input() producto!: Producto;
  @Output() cerrar = new EventEmitter<void>();

  movimientos: MovimientoInventario[] = [];
  cargando = true;
  error = '';

  constructor(private movimientoService: MovimientoService) {}

  ngOnChanges() {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.error = '';
    try {
      this.movimientos = await this.movimientoService.historialPorProducto(this.producto.id!);
    } catch {
      this.error = 'No se pudo cargar el historial de movimientos.';
    } finally {
      this.cargando = false;
    }
  }

  etiquetaTipo(tipo: string): string {
    return { INGRESO: 'Ingreso', SALIDA: 'Salida', AJUSTE: 'Ajuste' }[tipo] ?? tipo;
  }

  formatearFecha(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
  }
}