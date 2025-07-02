import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcourComponent } from './parcour.component';

describe('ParcourComponent', () => {
  let component: ParcourComponent;
  let fixture: ComponentFixture<ParcourComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParcourComponent]
    });
    fixture = TestBed.createComponent(ParcourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
