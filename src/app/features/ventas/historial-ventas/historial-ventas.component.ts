import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../../models/venta.model';
import { HistorialVentasService } from '../../../core/services/historial-ventas.service';
import { DetalleVentaDialogComponent } from '../detalle-venta-dialog/detalle-venta-dialog.component';

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasIso(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, DetalleVentaDialogComponent],
  templateUrl: './historial-ventas.component.html',
  styleUrl: './historial-ventas.component.scss'
})
export class HistorialVentasComponent implements OnInit {
  desde = haceDiasIso(7);
  hasta = hoyIso();

  ventas: Venta[] = [];
  cargando = true;
  error = '';

  ventaSeleccionada: Venta | null = null;

  constructor(private historialService: HistorialVentasService) {}

  ngOnInit() {
    this.buscar();
  }

  async buscar() {
    this.cargando = true;
    this.error = '';
    try {
      this.ventas = await this.historialService.listarPorRango(this.desde, this.hasta);
    } catch {
      this.error = 'No se pudo cargar el historial de ventas.';
    } finally {
      this.cargando = false;
    }
  }

  get totalDelRango(): number {
    return this.ventas
      .filter(v => v.estado !== 'anulada')
      .reduce((acc, v) => acc + v.total, 0);
  }

  verDetalle(venta: Venta) {
    this.ventaSeleccionada = venta;
  }

  onCerrarDetalle() {
    this.ventaSeleccionada = null;
  }

  onVentaActualizada() {
    this.ventaSeleccionada = null;
    this.buscar();
  }
}