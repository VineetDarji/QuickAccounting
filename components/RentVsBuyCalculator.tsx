import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface RentVsBuyCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const calcEmi = (principal: number, annualRatePct: number, years: number) => {
  const p = Math.max(0, principal);
  const r = Math.max(0, annualRatePct) / 100 / 12;
  const n = Math.max(0, Math.floor(years * 12));
  if (n === 0) return 0;
  if (r === 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const loanBalanceAfter = (principal: number, annualRatePct: number, years: number, monthsPaid: number) => {
  const p = Math.max(0, principal);
  const r = Math.max(0, annualRatePct) / 100 / 12;
  const n = Math.max(0, Math.floor(years * 12));
  const m = Math.min(Math.max(0, Math.floor(monthsPaid)), n);
  if (n === 0) return 0;
  if (r === 0) return p * (1 - m / n);
  const powN = Math.pow(1 + r, n);
  const powM = Math.pow(1 + r, m);
  return p * (powN - powM) / (powN - 1);
};

const RentVsBuyCalculator: React.FC<RentVsBuyCalculatorProps> = ({ user, onSave }) => {
  const [years, setYears] = useState(10);
  const [homePrice, setHomePrice] = useState(8000000);
  const [downPct, setDownPct] = useState(20);
  const [loanRate, setLoanRate] = useState(9);
  const [loanTenure, setLoanTenure] = useState(20);

  const [monthlyRent, setMonthlyRent] = useState(30000);
  const [rentEscPct, setRentEscPct] = useState(5);

  const [homeAppreciationPct, setHomeAppreciationPct] = useState(4);
  const [investReturnPct, setInvestReturnPct] = useState(10);

  const [maintenanceMonthly, setMaintenanceMonthly] = useState(3000);
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(0);

  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const horizonYears = Math.max(1, Math.floor(years));
    const months = horizonYears * 12;

    const price = Math.max(0, homePrice);
    const downPayment = price * (Math.max(0, Math.min(100, downPct)) / 100);
    const loan = Math.max(0, price - downPayment);

    const emi = calcEmi(loan, loanRate, loanTenure);
    const remaining = loanBalanceAfter(loan, loanRate, loanTenure, months);

    const homeValue = price * Math.pow(1 + Math.max(0, homeAppreciationPct) / 100, horizonYears);
    const equity = Math.max(0, homeValue - remaining);

    const invMonthlyRate = Math.max(0, investReturnPct) / 100 / 12;
    const rentEscMonthlyFactor = Math.pow(1 + Math.max(0, rentEscPct) / 100, 1 / 12);

    const ownerMonthlyFixed = Math.max(0, emi) + Math.max(0, maintenanceMonthly) + Math.max(0, propertyTaxAnnual) / 12;

    let rent = Math.max(0, monthlyRent);
    let investment = downPayment; // if renting, downpayment can be invested
    let totalRentPaid = 0;
    let totalOwnerCashOut = downPayment;

    for (let i = 0; i < months; i += 1) {
      // Rent scenario
      investment *= 1 + invMonthlyRate;
      totalRentPaid += rent;

      // Compare monthly cashflows: owner pays ownerMonthlyFixed, renter pays rent.
      const diff = ownerMonthlyFixed - rent; // if positive, renter saves and can invest diff
      investment += diff;

      // Owner cash out tracking
      totalOwnerCashOut += ownerMonthlyFixed;

      // update rent for next month
      rent *= rentEscMonthlyFactor;
    }

    const rentNetWorth = investment;
    const buyNetWorth = equity;

    return {
      horizonYears,
      downPayment,
      loan,
      emi,
      remainingLoan: remaining,
      homeValue,
      buyNetWorth,
      rentNetWorth,
      netWorthDiff: buyNetWorth - rentNetWorth,
      totalRentPaid,
      totalOwnerCashOut,
      ownerMonthlyFixed,
    };
  }, [
    downPct,
    homeAppreciationPct,
    homePrice,
    investReturnPct,
    loanRate,
    loanTenure,
    maintenanceMonthly,
    monthlyRent,
    propertyTaxAnnual,
    rentEscPct,
    years,
  ]);

  const recommendation = res.netWorthDiff >= 0 ? 'BUY' : 'RENT';

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Rent vs Buy ${new Date().toLocaleDateString()}`,
      type: 'RENT_BUY',
      timestamp: Date.now(),
      inputs: {
        years,
        homePrice,
        downPct,
        loanRate,
        loanTenure,
        monthlyRent,
        rentEscPct,
        homeAppreciationPct,
        investReturnPct,
        maintenanceMonthly,
        propertyTaxAnnual,
      },
      results: {
        emi: res.emi,
        buyNetWorth: res.buyNetWorth,
        rentNetWorth: res.rentNetWorth,
        netWorthDiff: res.netWorthDiff,
        recommendation,
      },
    };
    onSave?.(calc);
    setLabel('');
    toastConfig.success(`Saved: ${calc.label}`);
  };

  return (
    <Card>
      <div className="p-8 space-y-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rent vs Buy (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Compares estimated net worth after a horizon, assuming you invest the down payment and monthly savings when renting.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Horizon (years)" type="number" value={years || ''} onChange={(e) => setYears(Number(e.target.value))} />
              <Input label="Home Price (₹)" type="number" value={homePrice || ''} onChange={(e) => setHomePrice(Number(e.target.value))} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Down Payment (%)" type="number" value={downPct || ''} onChange={(e) => setDownPct(Number(e.target.value))} />
              <Input label="Loan Interest (% p.a.)" type="number" value={loanRate || ''} onChange={(e) => setLoanRate(Number(e.target.value))} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Loan Tenure (years)" type="number" value={loanTenure || ''} onChange={(e) => setLoanTenure(Number(e.target.value))} />
              <Input label="Maintenance (monthly) (₹)" type="number" value={maintenanceMonthly || ''} onChange={(e) => setMaintenanceMonthly(Number(e.target.value))} />
            </div>

            <Input
              label="Property Tax (annual) (₹)"
              type="number"
              value={propertyTaxAnnual || ''}
              onChange={(e) => setPropertyTaxAnnual(Number(e.target.value))}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Monthly Rent (₹)" type="number" value={monthlyRent || ''} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
              <Input label="Rent Escalation (% p.a.)" type="number" value={rentEscPct || ''} onChange={(e) => setRentEscPct(Number(e.target.value))} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Home Appreciation (% p.a.)"
                type="number"
                value={homeAppreciationPct || ''}
                onChange={(e) => setHomeAppreciationPct(Number(e.target.value))}
              />
              <Input
                label="Investment Return (% p.a.)"
                type="number"
                value={investReturnPct || ''}
                onChange={(e) => setInvestReturnPct(Number(e.target.value))}
              />
            </div>

            {user ? (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Scenario name..."
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600"
                />
                <Button onClick={handleSave} size="sm">
                  Save
                </Button>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400">Login to save scenarios.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">EMI (Monthly)</p>
              <div className="text-4xl font-black mt-2">{rupee(res.emi)}</div>
              <p className="text-xs text-white/70 mt-3 font-semibold">
                Owner monthly cost (incl. maintenance/tax): <span className="font-black text-white">{rupee(res.ownerMonthlyFixed)}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rent Net Worth</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{rupee(res.rentNetWorth)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total rent paid: {rupee(res.totalRentPaid)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buy Net Worth</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{rupee(res.buyNetWorth)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Home value: {rupee(res.homeValue)}; Loan balance: {rupee(res.remainingLoan)}
                </p>
              </div>
            </div>

            <div
              className={`rounded-3xl p-8 border-2 shadow-lg ${
                recommendation === 'BUY'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-indigo-500/40'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500/40'
              }`}
            >
              <p className="text-white/70 text-xs font-black uppercase tracking-widest">Recommendation (Net Worth)</p>
              <div className="text-3xl font-black mt-2">{recommendation === 'BUY' ? 'BUY' : 'RENT'}</div>
              <p className="text-sm text-white/90 mt-3 font-semibold">
                Difference (Buy - Rent): <span className="font-black">{rupee(res.netWorthDiff)}</span>
              </p>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: This is a simplified model and does not include taxes, transaction costs, vacancy risk, or changes in rates.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RentVsBuyCalculator;

