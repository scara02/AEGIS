export interface DataSource {
  id: number;
  ip: string;
  name: string;
  description: string;
  last_seen: Date;
}

export class DataSourceModel implements DataSource {
  constructor(
    public id: number,
    public ip: string,
    public name: string,
    public description: string,
    public last_seen: Date
  ) {}
}
