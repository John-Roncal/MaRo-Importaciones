import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta, DetalleVentaConProducto } from '../../../models/venta.model';
import { HistorialVentasService } from '../../../core/services/historial-ventas.service';

@Component({
  selector: 'app-detalle-venta-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-venta-dialog.component.html',
  styleUrl: './detalle-venta-dialog.component.scss'
})
export class DetalleVentaDialogComponent implements OnChanges {
  @Input() venta!: Venta;
  @Output() cerrar = new EventEmitter<void>();
  @Output() actualizada = new EventEmitter<void>();

  items: DetalleVentaConProducto[] = [];
  cargando = true;
  error = '';

  modoEdicion = false;
  guardandoItemId: string | null = null;
  anulando = false;

  constructor(private historialService: HistorialVentasService) {}

  ngOnChanges() {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.error = '';
    try {
      this.items = await this.historialService.obtenerDetalle(this.venta.id!);
    } catch {
      this.error = 'No se pudo cargar el detalle de la venta.';
    } finally {
      this.cargando = false;
    }
  }

  get estaAnulada(): boolean {
    return this.venta.estado === 'anulada';
  }

  async guardarItem(item: DetalleVentaConProducto) {
    this.guardandoItemId = item.id!;
    this.error = '';
    try {
      await this.historialService.editarItem(item.id!, item.cantidad, item.precio_unitario);
      this.actualizada.emit();
    } catch (e: any) {
      this.error = e?.message ?? 'No se pudo guardar el cambio.';
    } finally {
      this.guardandoItemId = null;
    }
  }

  async anular() {
    const confirmado = confirm('¿Anular esta venta? El stock de sus productos se repondrá automáticamente. Esta acción queda registrada y no se puede deshacer.');
    if (!confirmado) return;

    this.anulando = true;
    this.error = '';
    try {
      await this.historialService.anularVenta(this.venta.id!);
      this.actualizada.emit();
    } catch (e: any) {
      this.error = e?.message ?? 'No se pudo anular la venta.';
    } finally {
      this.anulando = false;
    }
  }
}