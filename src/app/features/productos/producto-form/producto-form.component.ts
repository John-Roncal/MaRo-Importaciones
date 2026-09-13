import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../../models/models';
import { ProductoService } from '../../../core/services/producto.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { BarcodeScannerComponent } from '../../../shared/barcode-scanner/barcode-scanner.component';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BarcodeScannerComponent],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss'
})
export class ProductoFormComponent implements OnChanges {
  @Input() producto: Producto | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  mostrarScanner = false;

  form: FormGroup;
  guardando = false;
  errorGeneral = '';

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private movimientoService: MovimientoService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      codigo_barras: [''],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
      unidad_medida: ['unidad', Validators.required],
      stock_inicial: [0, [Validators.min(0)]]
    });
  }

  ngOnChanges() {
    if (this.producto) {
      this.form.patchValue(this.producto);
      this.form.get('stock_inicial')?.disable();
    } else {
      this.form.reset({
        nombre: '', codigo_barras: '', precio_compra: 0, precio_venta: 0,
        stock_minimo: 0, unidad_medida: 'unidad', stock_inicial: 0
      });
      this.form.get('stock_inicial')?.enable();
    }
  }

  get esEdicion(): boolean {
    return !!this.producto;
  }

  abrirScanner() {
    this.mostrarScanner = true;
  }

  onCodigoDetectado(codigo: string) {
    this.form.patchValue({ codigo_barras: codigo });
    this.mostrarScanner = false;
  }

  get margenNegativo(): boolean {
    const { precio_compra, precio_venta } = this.form.value;
    return precio_venta > 0 && precio_venta <= precio_compra;
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.errorGeneral = '';
    try {
      const { stock_inicial, ...datos } = this.form.getRawValue();
      if (this.esEdicion && this.producto?.id) {
        await this.productoService.actualizar(this.producto.id, datos);
      } else {
        const creado = await this.productoService.crear(datos);
        if (stock_inicial > 0 && creado.id) {
          await this.movimientoService.registrarIngreso(creado.id, stock_inicial, 'stock_inicial');
        }
      }
      this.guardado.emit();
    } catch {
      this.errorGeneral = 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.';
    } finally {
      this.guardando = false;
    }
  }
}