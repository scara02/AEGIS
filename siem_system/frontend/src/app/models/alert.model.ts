export interface Alert {
  id: number;
  event_ids: string;
  prediction: string;
  source: string;
  status: string;
  timestamp: Date;
  raw_logs: string;
  isExpanded: boolean;
}
