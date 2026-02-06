import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface RdCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const RdCalculator: React.FC<RdCalculatorProps> = ({ user, onSave }) => {
  const [monthlyDeposit, setMonthlyDeposit] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(5);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const p = Math.max(0, monthlyDeposit);
    const r = Math.max(0, rate) / 100 / 12;
    const n = Math.max(0, Math.floor(years * 12));
    const maturity = r > 0 ? p * ((Math.pow(1 + r, n) - 1) / r) : p * n;
    const invested = p * n;
    return { maturity, invested, interest: maturity - invested };
  }, [monthlyDeposit, rate, years]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `RD ${monthlyDeposit}/m for ${years}y`,
      type: 'RD',
      timestamp: Date.now(),
      inputs: { monthlyDeposit, rate, years },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">RD Maturity Calculator</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Uses a simple monthly compounding annuity model (estimate).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Monthly Deposit (₹)"
              type="number"
              value={monthlyDeposit || ''}
              onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Interest Rate (% p.a.)" type="number" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} />
              <Input label="Tenure (years)" type="number" value={years || ''} onChange={(e) => setYears(Number(e.target.value))} />
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
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Maturity Amount</p>
              <div className="text-4xl font-black mt-2">{rupee(res.maturity)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">Invested</div>
                  <div className="text-lg font-black mt-1">{rupee(res.invested)}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">Interest</div>
                  <div className="text-lg font-black mt-1">{rupee(res.interest)}</div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: RD interest calculation varies by bank/product. This is a simplified estimate.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RdCalculator;

