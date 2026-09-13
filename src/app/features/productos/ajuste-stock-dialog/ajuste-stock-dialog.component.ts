import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, TipoMovimiento } from '../../../models/models';
import { MovimientoService } from '../../../core/services/movimiento.service';

@Component({
  selector: 'app-ajuste-stock-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajuste-stock-dialog.component.html',
  styleUrl: './ajuste-stock-dialog.component.scss'
})
export class AjusteStockDialogComponent implements OnChanges {
  @Input() producto!: Producto;
  @Output() cerrar = new EventEmitter<void>();
  @Output() aplicado = new EventEmitter<void>();

  tipo: TipoMovimiento = 'INGRESO';
  cantidad = 1;
  motivo = 'compra';
  guardando = false;
  error = '';

  constructor(private movimientoService: MovimientoService) {}

  ngOnChanges() {
    this.tipo = 'INGRESO';
    this.cantidad = 1;
    this.motivo = 'compra';
    this.error = '';
  }

  get motivosDisponibles(): string[] {
    return this.tipo === 'INGRESO'
      ? ['compra', 'devolucion', 'ajuste_manual']
      : ['venta', 'merma', 'ajuste_manual'];
  }

  async aplicar() {
    if (this.cantidad <= 0) {
      this.error = 'Ingresa una cantidad mayor a 0.';
      return;
    }
    this.guardando = true;
    this.error = '';
    try {
      await this.movimientoService.registrar({
        producto_id: this.producto.id!,
        tipo: this.tipo,
        cantidad: this.cantidad,
        motivo: this.motivo
      });
      this.aplicado.emit();
    } catch (e: any) {
      this.error = e?.message?.includes('Stock insuficiente')
        ? 'No hay suficiente stock para esta salida.'
        : 'No se pudo registrar el movimiento.';
    } finally {
      this.guardando = false;
    }
  }
}