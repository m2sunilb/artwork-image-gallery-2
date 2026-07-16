export type Role = 'System Admin' | 'GMS Integrator' | 'BU Contributor' | 'General Viewer';
export type BU = 'United Kingdom' | 'Germany' | 'Netherlands' | 'United States' | 'India' | 'Global' | 'All';
export type BG = 'Beauty & Wellbeing (B&W)' | 'Personal Care (PC)' | 'Home Care (HC)' | 'Nutrition (NU)' | 'Ice Cream (IC)' | 'All';

export type Status = 'Active' | 'Archived' | 'Deleted';

export interface User {
  role: Role;
  bu: BU;
  bg: BG;
  name: string;
  email: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface ImageRecord {
  id: string;
  title: string;
  description: string;
  custId: string;
  tabId?: string;
  bu: BU;
  bg: BG;
  status: Status;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  history: AuditEntry[];
  imageUrl: string;
  hasImage: boolean;
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert';
}

export type ViewState = 'library' | 'bulk-upload' | 'reports' | 'admin';
