export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'WARD_STAFF';

export interface Hospital {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  bed_count: number;
  is_active: boolean;
  clinical_module_enabled: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  hospital: Hospital | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {}

export interface RegisterResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Ward {
  id: number;
  name: string;
  hospital: number;
  capacity: number;
  created_at: string;
}

export interface Bed {
  id: number;
  number: string;
  ward: number;
  ward_name?: string;
  is_occupied: boolean;
}

export interface Patient {
  id: number;
  mrn: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  hospital: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admission {
  id: number;
  patient: number;
  patient_mrn?: string;
  bed: number | null;
  bed_number?: string;
  ward_name?: string;
  admitted_by: number | null;
  admitted_at: string;
  discharged_at: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface ClinicalEvent {
  id: number;
  patient: number;
  admission: number;
  event_type: string;
  recorded_by: number | null;
  recorded_at: string;
  payload: Record<string, unknown>;
  notes: string;
  created_at: string;
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EscalationAlert {
  id: number;
  rule: number;
  rule_name?: string;
  priority?: AlertPriority;
  patient: number;
  admission: number;
  triggered_at: string;
  status: AlertStatus;
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface WorkflowStep {
  id: number;
  instance: number;
  step_index: number;
  title: string;
  is_completed: boolean;
  completed_by: number | null;
  completed_at: string | null;
  notes: string;
}

export type WorkflowTrigger = 'ON_ADMIT' | 'ON_DISCHARGE' | 'MANUAL';
export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkflowTemplate {
  id: number;
  name: string;
  hospital: number;
  steps: { index: number; title: string; description: string }[];
  trigger: WorkflowTrigger;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowInstance {
  id: number;
  template: number;
  template_name?: string;
  admission: number;
  status: WorkflowStatus;
  assigned_to: number | null;
  started_at: string | null;
  completed_at: string | null;
  steps: WorkflowStep[];
  created_at: string;
}

export type PromptType = 'PATIENT_SUMMARY' | 'DISCHARGE_READINESS' | 'RISK_FLAG' | 'CLINICAL_SUMMARY';
export type RequestStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface IntelligenceRequest {
  id: number;
  patient: number;
  admission: number;
  prompt_type: PromptType;
  status: RequestStatus;
  clinical_context_used: boolean;
  response_text: string | null;
  disclaimer: string;
  tokens_used: number | null;
  latency_ms: number | null;
  created_at: string;
  completed_at: string | null;
}

export type NotificationKind = 'ESCALATION' | 'INTELLIGENCE_COMPLETE' | 'WORKFLOW_UPDATE' | 'GENERAL';

export interface Notification {
  id: number;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
}
