import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjusteStockDialogComponent } from './ajuste-stock-dialog.component';

describe('AjusteStockDialogComponent', () => {
  let component: AjusteStockDialogComponent;
  let fixture: ComponentFixture<AjusteStockDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjusteStockDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjusteStockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
