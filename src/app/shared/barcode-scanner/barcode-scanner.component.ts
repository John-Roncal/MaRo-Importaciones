import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss'
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @Output() detectado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('lector', { static: true }) lectorRef!: ElementRef<HTMLDivElement>;

  private scanner: Html5Qrcode | null = null;
  private readonly ID_LECTOR = 'lector-codigo-barras';

  iniciando = true;
  error = '';

  ngAfterViewInit() {
    this.lectorRef.nativeElement.id = this.ID_LECTOR;
    this.iniciarCamara();
  }

  private async iniciarCamara() {
    try {
      this.scanner = new Html5Qrcode(this.ID_LECTOR, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE
        ],
        verbose: false
      });

      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (codigoDetectado: string) => this.onDetectado(codigoDetectado),
        () => { /* no se detectó nada en este frame: se llama constantemente, se ignora */ }
      );

      this.iniciando = false;
    } catch {
      this.iniciando = false;
      this.error = 'No se pudo acceder a la cámara. Revisa los permisos del navegador y que el sitio use HTTPS.';
    }
  }

  private async onDetectado(codigo: string) {
    if (!this.scanner) return;
    try {
      await this.scanner.stop();
    } catch { /* puede que ya se haya detenido */ }
    this.detectado.emit(codigo);
  }

  async ngOnDestroy() {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        this.scanner.clear();
      } catch { /* la cámara ya podía estar detenida */ }
    }
  }

  cancelar() {
    this.cerrar.emit();
  }
}