export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'PARTNER' | 'TEAM_MEMBER' | 'HR' | 'KYC_OPERATOR';

export type Designation = 
  | 'OPERATIONAL_HEAD'
  | 'OPERATIONAL HEAD'
  | 'OPERATIONS_HEAD'
  | 'OPERATIONS HEAD'
  | 'ADMINISTRATIVE_OPERATOR'
  | 'ADMINISTRATIVE OPERATOR'
  | 'ADMINISTRATIVE_SALES_EXECUTIVE'
  | 'ADMINISTRATIVE SALES EXECUTIVE'
  | 'PAN_CHECKER'
  | 'PAN CHECKER'
  | 'REMARK_OPERATOR'
  | 'REMARK OPERATOR'
  | 'QD_OPERATOR'
  | 'QD OPERATOR'
  | 'FINAL_STATUS_OPERATOR'
  | 'FINAL STATUS OPERATOR'
  | 'QUERABLE_OPERATOR'
  | 'QUERABLE OPERATOR'
  | 'Querable Operator'
  | 'KYC_OPERATOR'
  | 'KYC OPERATOR'
  | 'SUPER_ADMIN'
  | 'BACKEND'
  | 'BACKEND OPERATION'
  | 'BACKEND_OPERATION';

export interface UserPermissions {
  banks?: string[];
  bank_codes?: string[];
  assigned_banks?: Array<{
    id: string;
    name: string;
    short_code: string;
    code?: string;
  }>;
}

export interface UserProfile {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  mobile: string;
  role: UserRole;
  department?: string;
  designation?: string;
  status: string;
  partner_id?: string;
  partner_code?: string;
  company_name?: string;
  profile_photo_url?: string;
  kyc_status?: string;
  rejection_reason?: string;
  available_balance?: number;
  pending_amount?: number;
  total_earned?: number;
  total_withdrawn?: number;
  permissions?: UserPermissions;
}

export interface ApplicationItem {
  id: string;
  app_number: string;
  customer_name: string;
  customer_mobile?: string;
  customer_email?: string;
  mobile?: string;
  pan_number?: string;
  city?: string;
  bank_name?: string;
  bank_code?: string;
  product_type?: string;
  product_name?: string;
  category?: string;
  status: string;
  final_status?: string;
  kyc_stage?: string;
  vkyc_stage?: string;
  bank_application_number?: string;
  bank_ref_number?: string;
  loan_amount?: number;
  approved_amount?: number;
  commission_amount?: number;
  commission_status?: string;
  currently_working_by?: string;
  operator_name?: string;
  employee_name?: string;
  partner_code?: string;
  submitted_by_name?: string;
  process_by?: string;
  process_type?: string;
  bank_remark?: string;
  user_remark?: string;
  app_file_generated?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  category?: string;
  type?: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  metadata?: {
    application_id?: string;
    lead_id?: string;
    customer_id?: string;
    product_id?: string;
    target?: string;
    [key: string]: any;
  };
  target?: string;
  application_id?: string;
  lead_id?: string;
  customer_id?: string;
}

export interface NotificationPreference {
  id?: string;
  user_id?: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  app_enabled: boolean;
  marketing_enabled?: boolean;
  commission_enabled?: boolean;
  kyc_enabled?: boolean;
  application_enabled?: boolean;
  language?: string;
  frequency?: string;
}

export interface ChatChipAction {
  label: string;
  action: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  chips?: ChatChipAction[];
  category?: string;
  isError?: boolean;
}

export interface ChatResponse {
  success: boolean;
  type?: string;
  message?: string;
  chips?: ChatChipAction[];
  category?: string;
  data?: any;
}

export type WhatsAppRecipientType = 'CUSTOMER' | 'EMPLOYEE';

export type WhatsAppDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface WhatsAppRecipient {
  id: string;
  type: WhatsAppRecipientType;
  name: string;
  mobile: string;
  mobile_masked?: string;
  pan_masked?: string;
  designation?: string;
  role?: string;
  app_number?: string;
  bank_name?: string;
  product_name?: string;
  status?: string;
  kyc_stage?: string;
}

export interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_category: string;
  language: string;
  body: string;
  header_type?: string;
  header_content?: string;
  footer?: string;
  variables?: string[] | Record<string, any>;
  sample_values?: Record<string, any>;
  allowed_roles?: string[];
  allowed_designations?: string[];
}

export interface WhatsAppMessage {
  id: string;
  message_uuid: string;
  sender_user_id?: string;
  sender_name?: string;
  recipient_type: WhatsAppRecipientType;
  recipient_name: string;
  recipient_mobile: string;
  template_name?: string;
  message_body: string;
  document_name?: string;
  document_url?: string;
  status: WhatsAppDeliveryStatus;
  failure_reason?: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  created_at?: string;
}

export interface WhatsAppSendRequest {
  template_name: string;
  recipient_mobile: string;
  recipient_name: string;
  recipient_type: WhatsAppRecipientType;
  variables?: Record<string, any>;
  application_id?: string;
  lead_id?: string;
  customer_id?: string;
  partner_id?: string;
  employee_id?: string;
  document_id?: string;
  document_name?: string;
  document_url?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export type ReportCategory = 'APPLICATIONS' | 'CUSTOMERS' | 'EMPLOYEES' | 'PARTNERS' | 'ADMINS' | 'SYSTEM';

export interface ReportFilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  designation?: string;
  department?: string;
  variant?: 'summary' | 'detailed';
}

export interface ReportItem {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  endpoint: string;
  exportEndpoint: string;
  icon: string;
  allowedRoles: string[];
}

export interface SystemReportMetrics {
  total_employees: number;
  active_employees: number;
  total_customers: number;
  total_applications: number;
  approved_applications: number;
  disbursed_applications: number;
  total_disbursed_amount: number;
  total_commission: number;
}

export interface ProfileUpdateRequest {
  fullName: string;
}

export interface PasswordChangeRequest {
  oldPassword?: string;
  newPassword: string;
}

export interface SecurityDeviceSession {
  id: string;
  device_id?: string;
  device_name?: string;
  browser?: string;
  ip_address?: string;
  city?: string;
  country?: string;
  created_at?: string;
  last_used_at?: string;
  is_current?: boolean;
}

export interface SecurityDashboardMetrics {
  lastLogin?: any;
  activeDevices: number;
  passwordChangedAt?: string;
  alerts?: any[];
}

export interface LeadItem {
  id: string;
  lead_number?: string;
  customer_name: string;
  mobile: string;
  email?: string;
  city?: string;
  status: string;
  priority?: string;
  source?: string;
  process_type?: string;
  product_id?: string;
  product_name?: string;
  product_category?: string;
  bank_name?: string;
  bank_code?: string;
  partner_code?: string;
  partner_first_name?: string;
  partner_last_name?: string;
  documents_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface CustomerItem {
  id: string;
  full_name: string;
  mobile: string;
  email?: string;
  pan_number?: string;
  city?: string;
  state?: string;
  pincode?: string;
  employment_type?: string;
  monthly_income?: number;
  employer?: string;
  pipeline_status?: string;
  applications_count?: number;
  latest_app_status?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Operational Queue Types
export interface OperatorHistory {
  id: string;
  application_id: string;
  operator_id?: string;
  operator_name: string;
  operator_role: string;
  operator_designation: string;
  operator_code: string;
  action_type: string;
  field_changes: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface KYCApplication extends ApplicationItem {
  kyc_status?: string;
  kyc_remarks?: string;
  kyc_stage?: string;
  vkyc_stage?: string;
  bio_stage?: string;
  digilocker_stage?: string;
  soft_approval_status?: string;
  ipa_stage?: string;
  vkyc_link?: string;
  user_remark?: string;
  last_operator_name?: string;
  last_operator_code?: string;
  last_operator_role?: string;
  last_operator_designation?: string;
  final_status_operator_code?: string;
  last_operated_at?: string;
  documents?: any[];
  operator_history?: OperatorHistory[];
}

export interface BankStatusUpdateParams {
  status?: string;
  bank_ref_number?: string;
  bank_application_number?: string;
  vkyc_stage?: string;
  iqa_stage?: string;
  dispatch_status?: string;
  bank_remark?: string;
  final_status?: string;
  decline_reason?: string;
  eligible_reqd?: string;
  app_file_generated?: string;
  ipa_stage?: string;
  kyc_stage?: string;
  card_approval_stage?: string;
  digital_card_issued?: string;
  income_details?: string;
  mail_status?: string;
  pan_check?: string;
  qd_status?: string;
}

export interface RemarkUpdateParams {
  remark_status?: string;
  remark?: string;
}

export interface KYCActionParams {
  remarks?: string;
  kyc_stage?: string;
  vkyc_stage?: string;
  bio_stage?: string;
  digilocker_stage?: string;
  notes?: string;
}

export interface QueueFilters {
  bank_id?: string;
  product_id?: string;
  status?: string;
  final_status?: string;
  dispatch_stage?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}
