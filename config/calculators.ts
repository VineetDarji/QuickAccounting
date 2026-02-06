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
    {
      id: 'HRA',
      label: 'HRA Exemption',
      component: lazy(() => import('../components/SpecificCalculators').then((m) => ({ default: m.HraCalculator }))),
    },
    {
      id: 'TDS',
      label: 'TDS Est.',
      component: lazy(() => import('../components/SpecificCalculators').then((m) => ({ default: m.TdsCalculator }))),
    },
    {
      id: 'NSC',
      label: 'NSC Maturity',
      component: lazy(() => import('../components/SpecificCalculators').then((m) => ({ default: m.NscCalculator }))),
    },
    { id: 'DEDUCT', label: '80C/80D Planner', component: lazy(() => import('../components/DeductionPlannerCalculator')) },
    { id: 'ADV', label: 'Advance Tax / Interest', component: lazy(() => import('../components/AdvanceTaxCalculator')) },
    { id: 'SALARY', label: 'Salary Take-home', component: lazy(() => import('../components/SalaryTakeHomeCalculator')) },
    { id: 'GRAT', label: 'Gratuity', component: lazy(() => import('../components/GratuityCalculator')) },
    { id: 'EPF', label: 'EPF / EPS', component: lazy(() => import('../components/EpfEpsCalculator')) },
    { id: 'NPS', label: 'NPS (80CCD)', component: lazy(() => import('../components/NpsCalculator')) },
    { id: 'RENTBUY', label: 'Rent vs Buy', component: lazy(() => import('../components/RentVsBuyCalculator')) },
    { id: 'GSTLATE', label: 'GST Late Fee/Interest', component: lazy(() => import('../components/GstLateFeeCalculator')) },
    { id: 'GSTRCM', label: 'GST RCM', component: lazy(() => import('../components/GstRcmCalculator')) },
    { id: 'TDSC', label: 'TDS Interest / 234E', component: lazy(() => import('../components/TdsComplianceCalculator')) },
    { id: 'TCS', label: 'TCS (206C)', component: lazy(() => import('../components/TcsCalculator')) },
    { id: 'PRES', label: 'Presumptive (44AD/44ADA/44AE)', component: lazy(() => import('../components/PresumptiveTaxCalculator')) },
    { id: 'DEPR', label: 'Depreciation Schedule', component: lazy(() => import('../components/DepreciationScheduleCalculator')) },
  ],
  INVEST: [
    {
      id: 'SIP',
      label: 'SIP Tool',
      component: lazy(() => import('../components/InvestmentCalculators').then((m) => ({ default: m.SipCalculator }))),
    },
    {
      id: 'LUMP',
      label: 'Lumpsum Tool',
      component: lazy(() => import('../components/InvestmentCalculators').then((m) => ({ default: m.LumpsumCalculator }))),
    },
    { id: 'FD', label: 'FD Maturity', component: lazy(() => import('../components/FdCalculator')) },
    { id: 'RD', label: 'RD Maturity', component: lazy(() => import('../components/RdCalculator')) },
    { id: 'PPF', label: 'PPF Maturity', component: lazy(() => import('../components/PpfCalculator')) },
  ],
  LOAN: [
    { id: 'EMI', label: 'EMI (Home/Auto)', component: lazy(() => import('../components/LoanCalculators')) },
  ],
};
