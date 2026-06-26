export type IssueCategory =
  | "Pothole"
  | "Water Leakage"
  | "Streetlight"
  | "Waste Management"
  | "Infrastructure"
  | "Other";

export type IssueStatus = "Reported" | "Verified" | "In Progress" | "Resolved";

export interface StatusHistoryItem {
  status: string;
  changed_at: string;
  note?: string;
}

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: number;
  auto_description: string;
  confidence: number;
  lat: number;
  lng: number;
  location_name: string;
  photos: string[];
  status: IssueStatus;
  confirmation_count: number;
  department_name: string;
  draft_complaint_text: string;
  is_hsvp_sector: boolean;
  created_at: string;
  updated_at: string;
  needs_attention: boolean;
  status_history: StatusHistoryItem[];
  raw_analysis_json?: string;
  raw_complaint_json?: string;
  simulated_days_old?: number;
  reporter_name?: string;
  confirmers?: string[];
}

export interface MapMarker {
  lat: number;
  lng: number;
  category: IssueCategory;
  severity: number;
  title: string;
}
