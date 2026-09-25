import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../../models/models';
import { ProductoService } from '../../../core/services/producto.service';
import { BarcodeScannerComponent } from '../../../shared/barcode-scanner/barcode-scanner.component';
import { redimensionarImagenABase64 } from '../../../shared/utils/image-utils';

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BarcodeScannerComponent],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss'
})
export class ProductoFormComponent implements OnChanges, OnDestroy {
  @Input() producto: Producto | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  mostrarScanner = false;
  mostrarCamara = false;
  iniciandoCamara = false;
  errorCamara = '';

  @ViewChild('videoCamara') videoCamaraRef?: ElementRef<HTMLVideoElement>;
  private streamCamara: MediaStream | null = null;

  // La imagen se maneja aparte del FormGroup (no es un <input> de texto normal)
  imagenBase64: string | null = null;
  errorImagen = '';

  form: FormGroup;
  guardando = false;
  errorGeneral = '';

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService
  ) {
    // precio_compra y los campos de lote (cantidad, fechas) SOLO se piden
    // al crear -- en ese momento se registran junto con el producto en un
    // solo paso. Al editar, no aparecen: el costo real vive en los lotes
    // y el stock se maneja siempre desde "Registrar ingreso" o el "±".
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      codigo_barras: [''],
      precio_compra: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      stock_minimo: [0, [Validators.required, Validators.min(0)]],
      unidad_medida: ['unidad', Validators.required],
      cantidad_inicial: [0, [Validators.min(0)]],
      fecha_ingreso: [hoyIso()],
      fecha_vencimiento: ['']
    });
  }

  ngOnChanges() {
    if (this.producto) {
      this.form.patchValue(this.producto);
      // Estos controles no se muestran ni se envían al editar.
      this.form.get('precio_compra')?.disable();
      this.form.get('cantidad_inicial')?.disable();
      this.form.get('fecha_ingreso')?.disable();
      this.form.get('fecha_vencimiento')?.disable();
      this.imagenBase64 = this.producto.imagen_base64 ?? null;
    } else {
      this.form.reset({
        nombre: '', codigo_barras: '', precio_compra: 0, precio_venta: 0,
        stock_minimo: 0, unidad_medida: 'unidad', cantidad_inicial: 0,
        fecha_ingreso: hoyIso(), fecha_vencimiento: ''
      });
      this.form.get('precio_compra')?.enable();
      this.form.get('cantidad_inicial')?.enable();
      this.form.get('fecha_ingreso')?.enable();
      this.form.get('fecha_vencimiento')?.enable();
      this.imagenBase64 = null;
    }
    this.errorImagen = '';
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

  async onImagenSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    this.errorImagen = '';
    try {
      this.imagenBase64 = await redimensionarImagenABase64(archivo, 300, 'image/jpeg');
    } catch {
      this.errorImagen = 'No se pudo procesar esa imagen. Prueba con otro archivo (PNG o JPG).';
    } finally {
      // Permite seleccionar o tomar la misma foto otra vez si fuera necesario.
      input.value = '';
    }
  }

  quitarImagen() {
    this.imagenBase64 = null;
  }

  async abrirCamara() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.errorImagen = 'Tu navegador no permite tomar fotos con la cámara.';
      return;
    }

    this.mostrarCamara = true;
    this.iniciandoCamara = true;
    this.errorCamara = '';
    try {
      this.streamCamara = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const video = this.videoCamaraRef?.nativeElement;
      if (!video) throw new Error('No se encontró la vista de cámara');
      video.srcObject = this.streamCamara;
      await video.play();
    } catch {
      this.errorCamara = 'No se pudo acceder a la cámara. Revisa los permisos del navegador y que el sitio use HTTPS.';
      this.detenerCamara();
    } finally {
      this.iniciandoCamara = false;
    }
  }

  tomarFoto() {
    const video = this.videoCamaraRef?.nativeElement;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const ancho = Math.min(300, video.videoWidth);
    const alto = Math.round((video.videoHeight / video.videoWidth) * ancho);
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      this.errorCamara = 'No se pudo procesar la foto tomada.';
      return;
    }

    contexto.drawImage(video, 0, 0, ancho, alto);
    this.imagenBase64 = canvas.toDataURL('image/jpeg', 0.85);
    this.errorImagen = '';
    this.cerrarCamara();
  }

  cerrarCamara() {
    this.detenerCamara();
    this.mostrarCamara = false;
    this.iniciandoCamara = false;
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  private detenerCamara() {
    this.streamCamara?.getTracks().forEach(track => track.stop());
    this.streamCamara = null;
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.errorGeneral = '';
    try {
      if (this.esEdicion && this.producto?.id) {
        const datos = this.form.getRawValue();
        datos.codigo_barras = datos.codigo_barras?.trim() ? datos.codigo_barras.trim() : null;
        datos.imagen_base64 = this.imagenBase64;
        delete datos.precio_compra;
        delete datos.cantidad_inicial;
        delete datos.fecha_ingreso;
        delete datos.fecha_vencimiento;
        await this.productoService.actualizar(this.producto.id, datos);
      } else {
        const v = this.form.getRawValue();
        await this.productoService.crearConLote({
          nombre: v.nombre,
          codigo_barras: v.codigo_barras?.trim() ? v.codigo_barras.trim() : null,
          imagen_base64: this.imagenBase64,
          precio_compra: v.precio_compra,
          precio_venta: v.precio_venta,
          stock_minimo: v.stock_minimo,
          unidad_medida: v.unidad_medida,
          cantidad_inicial: v.cantidad_inicial || null,
          fecha_ingreso: v.fecha_ingreso,
          fecha_vencimiento: v.fecha_vencimiento || null
        });
      }
      this.guardado.emit();
    } catch {
      this.errorGeneral = 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.';
    } finally {
      this.guardando = false;
    }
  }
}