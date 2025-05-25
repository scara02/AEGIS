import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsonPretty',
  standalone: true
})
export class JsonPrettyPipe implements PipeTransform {

  private excludedKeys = ['result', 'table', '_time', '_start', '_stop', '_measurement', 'isExpanded'];

  transform(value: any): string {
    const cleaned = this.cleanObject(value);
    return JSON.stringify(cleaned, null, 2);
  }

  private cleanObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj)
        .filter(([key, val]) =>
          !this.excludedKeys.includes(key) && val !== null && val !== undefined
        )
        .reduce((acc, [key, val]) => {
          acc[key] = this.cleanObject(val);
          return acc;
        }, {} as any);
    }
    return obj;
  }
}
