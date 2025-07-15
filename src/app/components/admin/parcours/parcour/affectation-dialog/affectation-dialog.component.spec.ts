import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationDialogComponent } from './affectation-dialog.component';

describe('AffectationDialogComponent', () => {
  let component: AffectationDialogComponent;
  let fixture: ComponentFixture<AffectationDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AffectationDialogComponent]
    });
    fixture = TestBed.createComponent(AffectationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
