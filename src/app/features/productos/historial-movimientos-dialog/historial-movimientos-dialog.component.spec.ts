import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialMovimientosDialogComponent } from './historial-movimientos-dialog.component';

describe('HistorialMovimientosDialogComponent', () => {
  let component: HistorialMovimientosDialogComponent;
  let fixture: ComponentFixture<HistorialMovimientosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialMovimientosDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialMovimientosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
