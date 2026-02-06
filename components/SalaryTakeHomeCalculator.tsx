import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface SalaryTakeHomeCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const SalaryTakeHomeCalculator: React.FC<SalaryTakeHomeCalculatorProps> = ({ user, onSave }) => {
  const [monthlyGross, setMonthlyGross] = useState(0);
  const [basicPct, setBasicPct] = useState(40);
  const [includePf, setIncludePf] = useState(true);
  const [employeePfPct, setEmployeePfPct] = useState(12);
  const [professionalTax, setProfessionalTax] = useState(200);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const gross = Math.max(0, monthlyGross);
    const basic = gross * (Math.max(0, basicPct) / 100);
    const pf = includePf ? basic * (Math.max(0, employeePfPct) / 100) : 0;
    const prof = Math.max(0, professionalTax);
    const other = Math.max(0, otherDeductions);
    const deductions = pf + prof + other;
    const takeHome = Math.max(0, gross - deductions);
    return {
      basic,
      employeePf: pf,
      professionalTax: prof,
      otherDeductions: other,
      totalDeductions: deductions,
      takeHome,
      annualGross: gross * 12,
      annualTakeHome: takeHome * 12,
    };
  }, [basicPct, employeePfPct, includePf, monthlyGross, otherDeductions, professionalTax]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Salary Take-home ${new Date().toLocaleDateString()}`,
      type: 'SALARY',
      timestamp: Date.now(),
      inputs: {
        monthlyGross,
        basicPct,
        includePf,
        employeePfPct,
        professionalTax,
        otherDeductions,
      },
      results: res,
    };
    onSave?.(calc);
    setLabel('');
    toastConfig.success(`Saved: ${calc.label}`);
  };

  return (
    <Card>
      <div className="p-8 space-y-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Salary Take-home (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Estimates take-home from monthly gross salary after PF/professional tax/other deductions (income tax not included).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Monthly Gross Salary (₹)"
              type="number"
              value={monthlyGross || ''}
              onChange={(e) => setMonthlyGross(Number(e.target.value))}
              placeholder="e.g. 100000"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Basic % of Gross"
                type="number"
                value={basicPct || ''}
                onChange={(e) => setBasicPct(Number(e.target.value))}
                placeholder="e.g. 40"
              />
              <Input
                label="Employee PF % of Basic"
                type="number"
                value={employeePfPct || ''}
                onChange={(e) => setEmployeePfPct(Number(e.target.value))}
                disabled={!includePf}
              />
            </div>

            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={includePf} onChange={(e) => setIncludePf(e.target.checked)} />
              Include Employee PF deduction
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Professional Tax (monthly) (₹)"
                type="number"
                value={professionalTax || ''}
                onChange={(e) => setProfessionalTax(Number(e.target.value))}
              />
              <Input
                label="Other Deductions (monthly) (₹)"
                type="number"
                value={otherDeductions || ''}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
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
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Estimated Monthly Take-home</p>
              <div className="text-4xl font-black mt-2">{rupee(res.takeHome)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">Total Deductions</div>
                  <div className="text-lg font-black mt-1">{rupee(res.totalDeductions)}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">Basic (Monthly)</div>
                  <div className="text-lg font-black mt-1">{rupee(res.basic)}</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-white/80 font-semibold">
                Annual take-home (est.): <span className="font-black">{rupee(res.annualTakeHome)}</span>
              </div>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: This does not include income tax/TDS. Use the Income Tax calculator for tax estimation.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SalaryTakeHomeCalculator;

