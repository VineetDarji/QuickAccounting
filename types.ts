
export interface Inquiry {
  id: string;
  userId?: string;
  name: string;
  email: string;
  service: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'responded';
}

export interface Activity {
  id: string;
  userName: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface SavedCalculation {
  id: string;
  userName: string;
  userEmail?: string;
  label: string;
  type:
    | 'INCOME_TAX'
    | 'GST'
    | 'EMI'
    | 'SIP'
    | 'LUMPSUM'
    | 'CAPITAL_GAINS'
    | 'DEDUCTIONS'
    | 'ADVANCE_TAX'
    | 'SALARY'
    | 'GRATUITY'
    | 'EPF'
    | 'NPS'
    | 'RENT_BUY'
    | 'GST_LATE_FEE'
    | 'GST_RCM'
    | 'TDS_COMPLIANCE'
    | 'TCS'
    | 'PRESUMPTIVE_TAX'
    | 'DEPRECIATION'
    | 'FD'
    | 'RD'
    | 'PPF';
  timestamp: number;
  inputs: any;
  results: any;
}

export interface ClientProfile {
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  pan: string;
  aadhaar: string;
  aadhaarDocument?: CaseDocument | null;
  notificationPrefs: {
    email: boolean;
    whatsapp: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export type CaseStatus = 'NEW' | 'IN_REVIEW' | 'WAITING_ON_CLIENT' | 'SCHEDULED' | 'ON_HOLD' | 'COMPLETED';

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
}

export type AppointmentMode = 'CALL' | 'VIDEO' | 'IN_PERSON';
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface CaseAppointment {
  id: string;
  requestedAt: number;
  preferredDate: string;
  preferredTime: string;
  mode: AppointmentMode;
  notes: string;
  status: AppointmentStatus;
  scheduledFor?: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'VOID';

export interface CaseInvoice {
  id: string;
  number: string;
  createdAt: number;
  dueDate: string;
  currency: 'INR';
  amount: number;
  description: string;
  status: InvoiceStatus;
  paymentLink: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface CaseTask {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeEmail?: string;
  createdAt: number;
  dueAt?: number;
}

export interface CaseInternalNote {
  id: string;
  authorEmail: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface TaxCase {
  id: string;
  clientEmail: string;
  clientName: string;
  title: string;
  service: string;
  status: CaseStatus;
  createdAt: number;
  updatedAt: number;
  providedData: Record<string, any>;
  documents: CaseDocument[];
  appointments: CaseAppointment[];
  invoices: CaseInvoice[];
  assignedToEmail: string;
  internalNotes: CaseInternalNote[];
  tasks: CaseTask[];
}

export interface TaxCalculationResult {
  taxableIncome: number;
  grossTax: number;
  cess: number;
  rebate: number;
  totalTax: number;
  effectiveRate: number;
}

export enum TaxRegime {
  OLD = 'OLD',
  NEW = 'NEW'
}

export enum AgeGroup {
  NORMAL = 'NORMAL', // < 60
  SENIOR = 'SENIOR', // 60 - 80
  SUPER_SENIOR = 'SUPER_SENIOR' // > 80
}

export interface User {
  email: string;
  role: 'user' | 'employee' | 'admin';
  name: string;
}
