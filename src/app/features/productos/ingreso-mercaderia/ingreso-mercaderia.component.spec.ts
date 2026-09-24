import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoMercaderiaComponent } from './ingreso-mercaderia.component';

describe('IngresoMercaderiaComponent', () => {
  let component: IngresoMercaderiaComponent;
  let fixture: ComponentFixture<IngresoMercaderiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresoMercaderiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresoMercaderiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
