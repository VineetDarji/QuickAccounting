import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface FdCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const FdCalculator: React.FC<FdCalculatorProps> = ({ user, onSave }) => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(3);
  const [compound, setCompound] = useState<'YEARLY' | 'HALF_YEARLY' | 'QUARTERLY' | 'MONTHLY'>('QUARTERLY');
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const p = Math.max(0, principal);
    const r = Math.max(0, rate) / 100;
    const y = Math.max(0, years);
    const n = compound === 'YEARLY' ? 1 : compound === 'HALF_YEARLY' ? 2 : compound === 'MONTHLY' ? 12 : 4;
    const maturity = p * Math.pow(1 + r / n, n * y);
    return { maturity, interest: maturity - p };
  }, [compound, principal, rate, years]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `FD ${principal} @ ${rate}%`,
      type: 'FD',
      timestamp: Date.now(),
      inputs: { principal, rate, years, compound },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">FD Maturity Calculator</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Simple compound interest FD maturity estimator.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input label="Principal (₹)" type="number" value={principal || ''} onChange={(e) => setPrincipal(Number(e.target.value))} />
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Interest Rate (% p.a.)" type="number" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} />
              <Input label="Tenure (years)" type="number" value={years || ''} onChange={(e) => setYears(Number(e.target.value))} />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Compounding</label>
              <select
                value={compound}
                onChange={(e) => setCompound(e.target.value as any)}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
              >
                <option value="YEARLY">Yearly</option>
                <option value="HALF_YEARLY">Half-yearly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Maturity Amount</p>
              <div className="text-4xl font-black mt-2">{rupee(res.maturity)}</div>
              <p className="text-xs text-white/70 mt-3 font-semibold">
                Interest earned: <span className="font-black text-white">{rupee(res.interest)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FdCalculator;

