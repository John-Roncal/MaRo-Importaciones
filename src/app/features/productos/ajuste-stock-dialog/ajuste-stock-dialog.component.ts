import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, TipoMovimiento } from '../../../models/models';
import { MovimientoService } from '../../../core/services/movimiento.service';

// El "Ingreso" de mercadería ahora tiene su propia pantalla dedicada
// (Registrar ingreso), porque necesita fecha de vencimiento y crea un
// lote nuevo. Este diálogo rápido queda solo para correcciones puntuales
// de stock: mermas/pérdidas/vencidos (Salida) o ajustes por conteo
// físico (Ajuste) -- ambos ahora respetan el modelo de lotes.
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

  tipo: TipoMovimiento = 'SALIDA';
  cantidad = 1;
  motivo = 'merma';
  guardando = false;
  error = '';

  constructor(private movimientoService: MovimientoService) {}

  ngOnChanges() {
    this.tipo = 'SALIDA';
    this.cantidad = 1;
    this.motivo = 'merma';
    this.error = '';
  }

  get motivosDisponibles(): string[] {
    return this.tipo === 'SALIDA'
      ? ['merma', 'perdida', 'vencido']
      : ['conteo_fisico', 'correccion'];
  }

  async aplicar() {
    if (this.cantidad < 0) {
      this.error = 'La cantidad no puede ser negativa.';
      return;
    }
    if (this.tipo === 'SALIDA' && this.cantidad === 0) {
      this.error = 'Ingresa una cantidad mayor a 0.';
      return;
    }

    this.guardando = true;
    this.error = '';
    try {
      if (this.tipo === 'SALIDA') {
        await this.movimientoService.registrarSalida(this.producto.id!, this.cantidad, this.motivo);
      } else {
        await this.movimientoService.registrarAjuste(this.producto.id!, this.cantidad, this.motivo);
      }
      this.aplicado.emit();
    } catch (e: any) {
      this.error = e?.message ?? 'No se pudo registrar el movimiento.';
    } finally {
      this.guardando = false;
    }
  }
}