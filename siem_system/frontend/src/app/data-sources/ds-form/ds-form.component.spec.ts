import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsFormComponent } from './ds-form.component';

describe('DsFormComponent', () => {
  let component: DsFormComponent;
  let fixture: ComponentFixture<DsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
