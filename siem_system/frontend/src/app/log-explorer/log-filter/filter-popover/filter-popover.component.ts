import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { LogService } from '../../../services/log-calls/log.service';

export interface Operator {
  name: string;
  value: string;
}

@Component({
  selector: 'app-filter-popover',
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './filter-popover.component.html',
  styleUrl: './filter-popover.component.css',
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class FilterPopoverComponent implements OnInit {
  @Input() availableFields: string[] = [];
  @Input() selectedMeasurement!: string;
  @Output() filterAdded = new EventEmitter<any>();
  @Output() operatorsLoaded = new EventEmitter<Operator[]>();

  availableValues: string[] = [];

  filterForm: FormGroup;
  operators: Operator[] = [];
  fullOperators: Operator[] = [

    {name: 'is', value: 'eq'},
    {name: 'is not', value: 'neq'},
    {name: 'is one of', value: 'in'},
    {name: 'is not one of', value: 'nin'},
    {name: 'exists', value: 'exists'},
    {name: 'does not exist', value: 'nexists'},
    {name: 'contains', value: 'contains'},
    {name: 'does not contain', value: 'ncontains'},
    {name: 'contains one of', value: 'containsAny'},
    {name: 'does not contain one of', value: 'ncontainsAny'},
    {name: 'starts with', value: 'startsWith'},
    {name: 'does not start with', value: 'nstartsWith'},
    {name: 'ends with', value: 'endsWith'},
    {name: 'does not end with', value: 'nendsWith'},
    {name: 'is between', value: 'between'},
    {name: 'is not between', value: 'nbetween'}
  ];

  rangeOperators = ['between', 'nbetween'];

  private operatorCompatibility: { [key: string]: string[] } = {
    'string': ['eq', 'neq', 'in', 'nin', 'contains', 'ncontains',
      'containsAny', 'ncontainsAny', 'startsWith', 'nstartsWith',
      'endsWith', 'nendsWith', 'exists', 'nexists'],
    'number': ['eq', 'neq', 'in', 'nin', 'between', 'nbetween', 'exists', 'nexists'],
    'boolean': ['eq', 'neq', 'exists', 'nexists'],
    'date': ['eq', 'neq', 'between', 'nbetween', 'exists', 'nexists']
  };

  constructor(
    private fb: FormBuilder,
    private logService: LogService,

    private cdr: ChangeDetectorRef) {
    this.filterForm = this.fb.group({
      field: [null, Validators.required],
      operator: [null, Validators.required],
      value: [null, Validators.required],
      valueFrom: [null],
      valueTo: [null]
    });

    this.filterForm.get('operator')?.valueChanges.subscribe(op => {
      this.updateValueControls(op);
    });
  }

  ngOnInit() {
    this.operatorsLoaded.emit(this.operators);
  }

  get currentOperator(): string {
    return this.filterForm.get('operator')?.value;
  }

  isRangeOperator(): boolean {
    return this.rangeOperators.includes(this.currentOperator);
  }

  getValuePlaceholder(): string {
    if (['in', 'nin'].includes(this.currentOperator)) {
      return 'Select values';
    }
    return this.availableValues.length > 0 ? 'Select value' : 'Enter value';
  }

  updateValueControls(operator: string): void {
    const valueControl = this.filterForm.get('value');
    const fromControl = this.filterForm.get('valueFrom');
    const toControl = this.filterForm.get('valueTo');

    valueControl?.reset();
    fromControl?.reset();
    toControl?.reset();

    if (this.rangeOperators.includes(operator)) {
      valueControl?.clearValidators();
      fromControl?.setValidators([Validators.required]);
      toControl?.setValidators([Validators.required]);
    } else {
      fromControl?.clearValidators();
      toControl?.clearValidators();
      const validators = ['exists', 'nexists'].includes(operator)
        ? []
        : [Validators.required];
      valueControl?.setValidators(validators);
    }

    valueControl?.updateValueAndValidity();
    fromControl?.updateValueAndValidity();
    toControl?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  applyFilter() {
    if (this.filterForm.valid) {
      const formValue = this.filterForm.value;
      let filterValue;

      if (Array.isArray(formValue.value)) {
        formValue.value = formValue.value.join(',');
      }

      if (this.isRangeOperator()) {
        filterValue = {
          field: formValue.field,
          operator: formValue.operator,
          valueFrom: formValue.valueFrom,
          valueTo: formValue.valueTo
        };
      } else {
        filterValue = {
          field: formValue.field,
          operator: formValue.operator,
          value: formValue.value
        };
      }

      this.filterAdded.emit(filterValue);
      this.filterForm.reset({
        field: null,
        operator: null,
        value: null,
        valueFrom: null,
        valueTo: null
      });
    }
  }

  onFieldChange() {
    const selectedField = this.filterForm.get('field')?.value;

    this.filterForm.patchValue({
      value: null,
      valueFrom: null,
      valueTo: null
    });

    if (this.selectedMeasurement && selectedField) {
      this.logService.getFieldType(this.selectedMeasurement, selectedField)
        .subscribe({
          next: (type) => {
            this.filterOperatorsByType(type);
            this.logService.getValues(this.selectedMeasurement, selectedField).subscribe({
              next: (values) => {
                this.availableValues = values;
                this.cdr.detectChanges();
              },
              error: (err) => console.error('Error fetching values:', err)
            });
          },
          error: (err) => {
            console.error('Error fetching field type:', err);
            this.operators = [...this.fullOperators];
            this.availableValues = [];
            this.cdr.detectChanges();
          }
        });
    } else {
      this.availableValues = [];
      this.operators = [...this.fullOperators];
      this.cdr.detectChanges();
    }
  }

  private filterOperatorsByType(fieldType: string): void {
    const allowed = this.operatorCompatibility[fieldType.toLowerCase()] || [];
    this.operators = this.fullOperators.filter(op => allowed.includes(op.value));

    const currentOp = this.filterForm.get('operator')?.value;
    if (currentOp && !allowed.includes(currentOp)) {
      this.filterForm.get('operator')?.reset();
    }
    this.operatorsLoaded.emit(this.operators);

    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }
}
