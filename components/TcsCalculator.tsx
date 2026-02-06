import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface TcsCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const TcsCalculator: React.FC<TcsCalculatorProps> = ({ user, onSave }) => {
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [threshold, setThreshold] = useState(5000000);
  const [rate, setRate] = useState(0.1);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const t = Math.max(0, totalReceipts);
    const th = Math.max(0, threshold);
    const base = Math.max(0, t - th);
    const tcs = base * (Math.max(0, rate) / 100);
    return { base, tcs };
  }, [rate, threshold, totalReceipts]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `TCS 206C(1H) ${new Date().toLocaleDateString()}`,
      type: 'TCS',
      timestamp: Date.now(),
      inputs: { totalReceipts, threshold, rate },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">TCS (206C(1H)) Calculator</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Simplified estimate for TCS on sale of goods beyond a threshold (defaults: 50L, rate 0.1%).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Total Receipts from Buyer in FY (₹)"
              type="number"
              value={totalReceipts || ''}
              onChange={(e) => setTotalReceipts(Number(e.target.value))}
              placeholder="e.g. 8000000"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Threshold (₹)" type="number" value={threshold || ''} onChange={(e) => setThreshold(Number(e.target.value))} />
              <Input label="TCS Rate (%)" type="number" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} />
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
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">TCS Amount</p>
              <div className="text-4xl font-black mt-2">{rupee(res.tcs)}</div>
              <p className="text-xs text-white/80 mt-3 font-semibold">
                Taxable base beyond threshold: <span className="font-black">{rupee(res.base)}</span>
              </p>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Rates and applicability can differ. This tool is a simplified estimator.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TcsCalculator;

