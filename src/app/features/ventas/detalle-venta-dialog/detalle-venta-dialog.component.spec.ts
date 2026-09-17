import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleVentaDialogComponent } from './detalle-venta-dialog.component';

describe('DetalleVentaDialogComponent', () => {
  let component: DetalleVentaDialogComponent;
  let fixture: ComponentFixture<DetalleVentaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleVentaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleVentaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
