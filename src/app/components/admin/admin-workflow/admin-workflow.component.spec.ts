import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWorkflowComponent } from './admin-workflow.component';

describe('AdminWorkflowComponent', () => {
  let component: AdminWorkflowComponent;
  let fixture: ComponentFixture<AdminWorkflowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminWorkflowComponent]
    });
    fixture = TestBed.createComponent(AdminWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
