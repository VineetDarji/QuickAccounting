import { lazy } from 'react';

export const CALCULATOR_CATEGORIES = [
  { id: 'TAX', label: 'Tax Tools', icon: '🧾' },
  { id: 'INVEST', label: 'Investment Tools', icon: '📈' },
  { id: 'LOAN', label: 'Loan Tools', icon: '🏠' },
];

export const CALCULATORS = {
  TAX: [
    { id: 'IT', label: 'Income Tax', component: lazy(() => import('../components/TaxCalculator')) },
    { id: 'GST', label: 'GST', component: lazy(() => import('../components/GstCalculator')) },
    { id: 'CAP', label: 'Capital Gains', component: lazy(() => import('../components/CapitalGainsCalculator')) },
    { id: 'HRA', label: 'HRA Exemption', component: lazy(() => import('../components/SpecificCalculators')) },
    { id: 'TDS', label: 'TDS Est.', component: lazy(() => import('../components/SpecificCalculators')) },
    { id: 'NSC', label: 'NSC Maturity', component: lazy(() => import('../components/SpecificCalculators')) },
  ],
  INVEST: [
    { id: 'SIP', label: 'SIP Tool', component: lazy(() => import('../components/InvestmentCalculators')) },
    { id: 'LUMP', label: 'Lumpsum Tool', component: lazy(() => import('../components/InvestmentCalculators')) },
  ],
  LOAN: [
    { id: 'EMI', label: 'EMI (Home/Auto)', component: lazy(() => import('../components/LoanCalculators')) },
  ],
};
