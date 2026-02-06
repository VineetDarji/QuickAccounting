import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface NpsCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const NpsCalculator: React.FC<NpsCalculatorProps> = ({ user, onSave }) => {
  const [mode, setMode] = useState<'SALARIED' | 'SELF'>('SALARIED');
  const [salaryBase, setSalaryBase] = useState(0);
  const [employeeContribution, setEmployeeContribution] = useState(0);
  const [employerContribution, setEmployerContribution] = useState(0);
  const [employerLimitPct, setEmployerLimitPct] = useState(10);
  const [grossTotalIncome, setGrossTotalIncome] = useState(0);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    if (mode === 'SELF') {
      const gti = Math.max(0, grossTotalIncome);
      const contrib = Math.max(0, employeeContribution);
      const limit1 = gti * 0.2;
      const allowed1 = Math.min(contrib, limit1);
      const allowed1b = Math.min(Math.max(0, contrib - allowed1), 50000);
      return {
        allowed80ccd1: allowed1,
        allowed80ccd1b: allowed1b,
        allowed80ccd2: 0,
        totalAllowed: allowed1 + allowed1b,
      };
    }

    const salary = Math.max(0, salaryBase);
    const emp = Math.max(0, employeeContribution);
    const employer = Math.max(0, employerContribution);
    const limit1 = salary * 0.1;
    const allowed1 = Math.min(emp, limit1);
    const allowed1b = Math.min(Math.max(0, emp - allowed1), 50000);
    const allowed2 = Math.min(employer, salary * (Math.max(0, employerLimitPct) / 100));
    return {
      allowed80ccd1: allowed1,
      allowed80ccd1b: allowed1b,
      allowed80ccd2: allowed2,
      totalAllowed: allowed1 + allowed1b + allowed2,
    };
  }, [employeeContribution, employerContribution, employerLimitPct, grossTotalIncome, mode, salaryBase]);

  const handleSave = () => {
    if (!user) return;
    const inputs =
      mode === 'SELF'
        ? { mode, grossTotalIncome, contribution: employeeContribution }
        : { mode, salaryBase, employeeContribution, employerContribution, employerLimitPct };

    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `NPS 80CCD ${new Date().toLocaleDateString()}`,
      type: 'NPS',
      timestamp: Date.now(),
      inputs,
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">NPS (80CCD) Deduction (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Simplified deduction estimate (80CCD(1), 80CCD(1B) up to 50k, and 80CCD(2) employer contribution for salaried).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Taxpayer Type</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
              >
                <option value="SALARIED">Salaried</option>
                <option value="SELF">Self-employed</option>
              </select>
            </div>

            {mode === 'SALARIED' ? (
              <>
                <Input
                  label="Basic + DA (Annual) (₹)"
                  type="number"
                  value={salaryBase || ''}
                  onChange={(e) => setSalaryBase(Number(e.target.value))}
                  placeholder="Salary base for percentage limits"
                />
                <Input
                  label="Your NPS Contribution (Annual) (₹)"
                  type="number"
                  value={employeeContribution || ''}
                  onChange={(e) => setEmployeeContribution(Number(e.target.value))}
                />
                <Input
                  label="Employer NPS Contribution (Annual) (₹)"
                  type="number"
                  value={employerContribution || ''}
                  onChange={(e) => setEmployerContribution(Number(e.target.value))}
                />
                <Input
                  label="Employer deduction limit (% of Basic+DA)"
                  type="number"
                  value={employerLimitPct || ''}
                  onChange={(e) => setEmployerLimitPct(Number(e.target.value))}
                />
              </>
            ) : (
              <>
                <Input
                  label="Gross Total Income (Annual) (₹)"
                  type="number"
                  value={grossTotalIncome || ''}
                  onChange={(e) => setGrossTotalIncome(Number(e.target.value))}
                />
                <Input
                  label="NPS Contribution (Annual) (₹)"
                  type="number"
                  value={employeeContribution || ''}
                  onChange={(e) => setEmployeeContribution(Number(e.target.value))}
                />
              </>
            )}

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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Estimated Eligible Deduction</p>
              <div className="text-4xl font-black mt-2">{rupee(res.totalAllowed)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">80CCD(1)</div>
                  <div className="text-lg font-black mt-1">{rupee(res.allowed80ccd1)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">80CCD(1B)</div>
                  <div className="text-lg font-black mt-1">{rupee(res.allowed80ccd1b)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 col-span-2">
                  <div className="text-white/60 font-black uppercase">80CCD(2) Employer</div>
                  <div className="text-lg font-black mt-1">{rupee(res.allowed80ccd2)}</div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: This is a simplified estimate. Actual limits depend on rules and your tax regime.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NpsCalculator;

