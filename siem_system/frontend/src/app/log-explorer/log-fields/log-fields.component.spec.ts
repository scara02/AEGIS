import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogFieldsComponent } from './log-fields.component';

describe('LogFieldsComponent', () => {
  let component: LogFieldsComponent;
  let fixture: ComponentFixture<LogFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LogFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
