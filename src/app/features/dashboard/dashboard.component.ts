import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/models';
import { ProductoService } from '../../core/services/producto.service';
import { BiService } from '../../core/services/bi.service';
import {
  Valorizacion, FilaRentabilidad, LoteSeguimiento,
  VentaDiaria, Granularidad, PuntoSerieVentas
} from '../../models/bi.model';

// ---- Helpers de fecha ----
// Todo se maneja con componentes LOCALES (año/mes/día), nunca con
// toISOString(), que convierte a UTC y puede correr el día en Perú.

function aIso(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function desdeIso(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(d: Date, dias: number): Date {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

// Lunes de la semana a la que pertenece la fecha (semana lunes-domingo).
function lunesDe(d: Date): Date {
  const retroceso = (d.getDay() + 6) % 7; // domingo(0)->6, lunes(1)->0, martes(2)->1 ...
  return sumarDias(d, -retroceso);
}

function diaMesCorto(d: Date): string {
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

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

  // ---- Ingresos y ganancias en el tiempo ----
  granularidad: Granularidad = 'dia';
  fechaDesde = aIso(sumarDias(new Date(), -29)); // por defecto, últimos 30 días
  fechaHasta = aIso(new Date());
  serie: PuntoSerieVentas[] = [];
  cargandoSerie = true;
  errorSerie = '';

  constructor(
    private productoService: ProductoService,
    private biService: BiService
  ) {}

  ngOnInit() {
    this.cargar();
    this.cargarSerie();
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

  // ---------- Ingresos y ganancias en el tiempo ----------

  async cargarSerie() {
    if (!this.fechaDesde || !this.fechaHasta || this.fechaDesde > this.fechaHasta) {
      this.errorSerie = 'El rango de fechas no es válido: "desde" debe ser anterior o igual a "hasta".';
      this.serie = [];
      this.cargandoSerie = false;
      return;
    }

    this.cargandoSerie = true;
    this.errorSerie = '';
    try {
      const diarias = await this.biService.obtenerVentasDiarias(this.fechaDesde, this.fechaHasta);
      this.serie = this.agrupar(diarias, this.granularidad);
    } catch {
      this.errorSerie = 'No se pudo cargar la información de ventas del período.';
      this.serie = [];
    } finally {
      this.cargandoSerie = false;
    }
  }

  // Al cambiar de vista se propone un rango razonable para esa granularidad
  // (ver 1 mes con barras "mensuales" mostraría una sola barra). Después el
  // usuario puede ajustar las fechas a mano.
  cambiarGranularidad(g: Granularidad) {
    this.granularidad = g;
    const hoy = new Date();
    const dias = g === 'dia' ? 29 : g === 'semana' ? 83 : 364;
    this.fechaHasta = aIso(hoy);
    this.fechaDesde = aIso(sumarDias(hoy, -dias));
    this.cargarSerie();
  }

  private agrupar(diarias: VentaDiaria[], g: Granularidad): PuntoSerieVentas[] {
    const grupos = new Map<string, PuntoSerieVentas>();

    for (const fila of diarias) {
      const fecha = desdeIso(fila.fecha);
      let clave: string;
      let etiqueta: string;

      if (g === 'dia') {
        clave = fila.fecha;
        etiqueta = diaMesCorto(fecha);
      } else if (g === 'semana') {
        const lunes = lunesDe(fecha);
        clave = aIso(lunes);
        etiqueta = `${diaMesCorto(lunes)} – ${diaMesCorto(sumarDias(lunes, 6))}`;
      } else {
        clave = fila.fecha.slice(0, 7); // 'YYYY-MM'
        etiqueta = fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
      }

      const existente = grupos.get(clave);
      if (existente) {
        existente.ingresos += Number(fila.ingresos);
        existente.ganancia += Number(fila.ganancia);
      } else {
        grupos.set(clave, {
          etiqueta,
          fechaOrden: clave,
          ingresos: Number(fila.ingresos),
          ganancia: Number(fila.ganancia)
        });
      }
    }

    return Array.from(grupos.values()).sort((a, b) => a.fechaOrden.localeCompare(b.fechaOrden));
  }

  get totalIngresosPeriodo(): number {
    return this.serie.reduce((acc, p) => acc + p.ingresos, 0);
  }

  get totalGananciaPeriodo(): number {
    return this.serie.reduce((acc, p) => acc + p.ganancia, 0);
  }

  // Valor más alto de la serie (ingresos o ganancia), para escalar las barras.
  get maxValorSerie(): number {
    return Math.max(...this.serie.map(p => Math.max(p.ingresos, p.ganancia, 0)), 1);
  }

  alturaBarra(valor: number): number {
    return Math.max((valor / this.maxValorSerie) * 100, 0);
  }
}