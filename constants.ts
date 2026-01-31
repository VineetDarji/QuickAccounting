
import { AgeGroup } from './types';

export const SERVICES = [
  {
    title: "Income Tax Filing",
    description: "Personal and Business ITR filing with expert verification.",
    icon: "📄"
  },
  {
    title: "GST Compliance",
    description: "Monthly returns, registration, and consultation.",
    icon: "💼"
  },
  {
    title: "TDS Returns",
    description: "Timely filing of TDS for salaried and non-salaried payments.",
    icon: "🏦"
  },
  {
    title: "Tax Audit",
    description: "Professional auditing for businesses exceeding turnover limits.",
    icon: "🔍"
  }
];

// Simplified Indian Tax Slabs FY 2024-25 (New Regime)
export const NEW_REGIME_SLABS_24_25 = [
  { limit: 300000, rate: 0 },
  { limit: 600000, rate: 0.05 },
  { limit: 900000, rate: 0.10 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 }
];

// Simplified Indian Tax Slabs FY 2024-25 (Old Regime - General)
export const OLD_REGIME_SLABS_24_25 = (ageGroup: AgeGroup) => {
  let exemptLimit = 250000;
  if (ageGroup === AgeGroup.SENIOR) exemptLimit = 300000;
  if (ageGroup === AgeGroup.SUPER_SENIOR) exemptLimit = 500000;

  return [
    { limit: exemptLimit, rate: 0 },
    { limit: 500000, rate: 0.05 },
    { limit: 1000000, rate: 0.20 },
    { limit: Infinity, rate: 0.30 }
  ];
};
