import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface EpfEpsCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const EpfEpsCalculator: React.FC<EpfEpsCalculatorProps> = ({ user, onSave }) => {
  const [basicMonthly, setBasicMonthly] = useState(0);
  const [employeeRate, setEmployeeRate] = useState(12);
  const [employerRate, setEmployerRate] = useState(12);
  const [applyEpsCeiling, setApplyEpsCeiling] = useState(true);
  const [epsCeiling, setEpsCeiling] = useState(15000);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const basic = Math.max(0, basicMonthly);
    const empPf = basic * (Math.max(0, employeeRate) / 100);
    const employerTotal = basic * (Math.max(0, employerRate) / 100);

    const epsBase = applyEpsCeiling ? Math.min(basic, Math.max(0, epsCeiling)) : basic;
    const eps = epsBase * (8.33 / 100);
    const employerPf = Math.max(0, employerTotal - eps);

    return {
      employeePf: empPf,
      employerPf,
      employerEps: eps,
      totalMonthly: empPf + employerTotal,
      annualEmployeePf: empPf * 12,
      annualEmployerPf: employerPf * 12,
      annualEmployerEps: eps * 12,
    };
  }, [applyEpsCeiling, basicMonthly, employeeRate, employerRate, epsCeiling]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `EPF/EPS ${new Date().toLocaleDateString()}`,
      type: 'EPF',
      timestamp: Date.now(),
      inputs: { basicMonthly, employeeRate, employerRate, applyEpsCeiling, epsCeiling },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">EPF / EPS Contribution (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Breaks down employee PF, employer PF and employer EPS (8.33%). Includes an optional EPS wage ceiling.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Monthly Basic Salary (₹)"
              type="number"
              value={basicMonthly || ''}
              onChange={(e) => setBasicMonthly(Number(e.target.value))}
              placeholder="e.g. 50000"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Employee PF Rate (%)"
                type="number"
                value={employeeRate || ''}
                onChange={(e) => setEmployeeRate(Number(e.target.value))}
              />
              <Input
                label="Employer PF Rate (%)"
                type="number"
                value={employerRate || ''}
                onChange={(e) => setEmployerRate(Number(e.target.value))}
              />
            </div>

            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={applyEpsCeiling} onChange={(e) => setApplyEpsCeiling(e.target.checked)} />
              Apply EPS wage ceiling
            </label>

            <Input
              label="EPS Ceiling (₹)"
              type="number"
              value={epsCeiling || ''}
              onChange={(e) => setEpsCeiling(Number(e.target.value))}
              disabled={!applyEpsCeiling}
            />

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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Monthly Contributions</p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Employee PF</div>
                  <div className="text-xl font-black mt-1">{rupee(res.employeePf)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Employer PF</div>
                  <div className="text-xl font-black mt-1">{rupee(res.employerPf)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Employer EPS</div>
                  <div className="text-xl font-black mt-1">{rupee(res.employerEps)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Total (Employee+Employer)</div>
                  <div className="text-xl font-black mt-1">{rupee(res.totalMonthly)}</div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: EPS/EPF rules can vary by establishment and wage ceiling applicability. This is a simplified estimator.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EpfEpsCalculator;

