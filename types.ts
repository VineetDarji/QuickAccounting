
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
  userEmail: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface SavedCalculation {
  id: string;
  userEmail: string;
  label: string;
  type: 'INCOME_TAX' | 'GST' | 'EMI' | 'SIP' | 'LUMPSUM' | 'CAPITAL_GAINS';
  timestamp: number;
  inputs: any;
  results: any;
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
  role: 'user' | 'admin';
  name: string;
}
