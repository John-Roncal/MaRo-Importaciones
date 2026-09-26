import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/models';
import { ProductoService } from '../../core/services/producto.service';
import { BiService } from '../../core/services/bi.service';
import { Valorizacion, FilaRentabilidad, LoteSeguimiento } from '../../models/bi.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  cargando = true;
  error = '';

  valorizacion: Valorizacion[] = [];
  filas: FilaRentabilidad[] = [];
  productosStockBajo: Producto[] = [];
  lotesSeguimiento: LoteSeguimiento[] = [];

  // Umbrales editables desde la misma pantalla -- no están fijos en el código.
  umbralVencimientoDias = 15;
  umbralAntiguedadDias = 30;

  totalInversion = 0;
  totalVentaPotencial = 0;
  gananciaPotencial = 0;
  gananciaReal = 0;

  constructor(
    private productoService: ProductoService,
    private biService: BiService
  ) {}

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.error = '';
    try {
      const [valorizacion, rentabilidad, ventas30d, productos, lotesSeguimiento] = await Promise.all([
        this.biService.obtenerValorizacion(),
        this.biService.obtenerRentabilidad(),
        this.biService.obtenerVentas30Dias(),
        this.productoService.listar(),
        this.biService.obtenerLotesSeguimiento()
      ]);

      this.valorizacion = valorizacion;
      this.totalInversion = valorizacion.reduce((acc, v) => acc + v.valor_inversion, 0);
      this.totalVentaPotencial = valorizacion.reduce((acc, v) => acc + v.valor_venta_potencial, 0);
      this.gananciaPotencial = this.totalVentaPotencial - this.totalInversion;

      const ventasPorProducto = new Map(ventas30d.map(v => [v.producto_id, v]));

      const ordenadas = [...rentabilidad].sort((a, b) => b.ganancia_total - a.ganancia_total);
      const totalGanancia = ordenadas.reduce((acc, r) => acc + Math.max(r.ganancia_total, 0), 0);
      this.gananciaReal = rentabilidad.reduce((acc, r) => acc + r.ganancia_total, 0);

      let acumulado = 0;
      this.filas = ordenadas.map(r => {
        acumulado += Math.max(r.ganancia_total, 0);
        const porcentajeAcumulado = totalGanancia > 0 ? (acumulado / totalGanancia) * 100 : 0;
        const clase = porcentajeAcumulado <= 80 ? 'A' : porcentajeAcumulado <= 95 ? 'B' : 'C';
        const v30 = ventasPorProducto.get(r.id);
        return {
          ...r,
          unidades_30d: v30?.unidades_30d ?? 0,
          ingresos_30d: v30?.ingresos_30d ?? 0,
          clase,
          porcentajeAcumulado
        };
      });

      this.productosStockBajo = productos.filter(p => (p.stock_actual ?? 0) <= p.stock_minimo);
      this.lotesSeguimiento = lotesSeguimiento;
    } catch {
      this.error = 'No se pudo cargar la información de rentabilidad. Revisa tu conexión.';
    } finally {
      this.cargando = false;
    }
  }

  get hayVentasRegistradas(): boolean {
    return this.filas.some(f => f.unidades_vendidas > 0);
  }

  get maxGanancia(): number {
    return Math.max(...this.filas.map(f => f.ganancia_total), 1);
  }

  anchoBarra(ganancia: number): number {
    return Math.max((ganancia / this.maxGanancia) * 100, 0);
  }

  get lotesPorVencer(): LoteSeguimiento[] {
    return this.lotesSeguimiento
      .filter(l => l.dias_para_vencer !== null && l.dias_para_vencer <= this.umbralVencimientoDias)
      .sort((a, b) => (a.dias_para_vencer ?? 0) - (b.dias_para_vencer ?? 0));
  }

  get lotesPorAntiguedad(): LoteSeguimiento[] {
    return this.lotesSeguimiento
      .filter(l => l.dias_en_inventario >= this.umbralAntiguedadDias)
      .sort((a, b) => b.dias_en_inventario - a.dias_en_inventario);
  }
}