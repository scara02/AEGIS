import {Component, EventEmitter, Output, ViewEncapsulation} from '@angular/core';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-time-filter',
  standalone: true,
  imports: [
    CommonModule,
    NgbPopoverModule,
    FormsModule,
    NgSelectModule
  ],
  templateUrl: './time-filter.component.html',
  styleUrls: ['./time-filter.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TimeFilterComponent {
  @Output() timeRangeSelected = new EventEmitter<{start: string, end: string}>();

  timeUnits = [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Days', value: 'days' },
    { label: 'Weeks', value: 'weeks' }
  ];

  selectedTimeUnit = 'days';
  timeValue = 30;

  predefinedRanges = [
    { label: 'last 15 minutes', value: 15 },
    { label: 'last 30 minutes', value: 30 },
    { label: 'last 1 hour', value: 60 },
    { label: 'last 6 hours', value: 360 },
    { label: 'last 12 hours', value: 720 },
    { label: 'last 24 hours', value: 1440 },
    { label: 'last 7 days', value: 10080 },
    { label: 'last 30 days', value: 43200 }
  ];

  customStart?: Date;
  customEnd?: Date;
  selectedRange = 'last 30 days';

  commonlyUsedExpanded = true;
  customRangeExpanded = false;

  onTimeInputChange() {
    if (this.timeValue && this.selectedTimeUnit) {
      const minutes = this.convertToMinutes(this.timeValue, this.selectedTimeUnit);
      const end = new Date();
      const start = new Date(end.getTime() - minutes * 60000);
      this.selectedRange = `last ${this.timeValue} ${this.selectedTimeUnit}`;
      this.emitTimeRange(start.toISOString(), end.toISOString());
    }
  }

  selectPredefinedRange(minutes: number) {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60000);
    this.selectedRange = this.predefinedRanges.find(r => r.value === minutes)?.label || 'Custom';
    this.emitTimeRange(start.toISOString(), end.toISOString());
  }

  applyCustomRange() {
    if (this.customStart && this.customEnd) {
      const startDate = new Date(this.customStart);
      const endDate = new Date(this.customEnd);
      console.log(endDate.toISOString())

      if (isNaN(startDate.getTime())) {
        console.error('Invalid start date');
        return;
      }
      if (isNaN(endDate.getTime())) {
        console.error('Invalid end date');
        return;
      }

      this.emitTimeRange(startDate.toISOString(), endDate.toISOString());
    }
  }

  private emitTimeRange(start: string, end: string) {
    this.timeRangeSelected.emit({ start, end });
  }

  toggleSection(section: 'common' | 'custom') {
    if (section === 'common') {
      this.commonlyUsedExpanded = !this.commonlyUsedExpanded;
    } else {
      this.customRangeExpanded = !this.customRangeExpanded;
    }
  }
  private convertToMinutes(value: number, unit: string): number {
    switch (unit) {
      case 'minutes': return value;
      case 'hours': return value * 60;
      case 'days': return value * 1440;
      case 'weeks': return value * 10080;
      default: return value;
    }
  }
}
