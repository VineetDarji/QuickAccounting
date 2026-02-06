import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface GratuityCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const GratuityCalculator: React.FC<GratuityCalculatorProps> = ({ user, onSave }) => {
  const [lastDrawnBasicDa, setLastDrawnBasicDa] = useState(0);
  const [years, setYears] = useState(5);
  const [months, setMonths] = useState(0);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const y = Math.max(0, Math.floor(years));
    const m = Math.min(11, Math.max(0, Math.floor(months)));
    const completedYears = y + (m >= 6 ? 1 : 0);
    const salary = Math.max(0, lastDrawnBasicDa);
    const gratuity = (15 / 26) * salary * completedYears;
    return { completedYears, gratuity };
  }, [lastDrawnBasicDa, months, years]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Gratuity ${new Date().toLocaleDateString()}`,
      type: 'GRATUITY',
      timestamp: Date.now(),
      inputs: { lastDrawnBasicDa, years, months },
      results: { gratuity: res.gratuity, completedYears: res.completedYears },
    };
    onSave?.(calc);
    setLabel('');
    toastConfig.success(`Saved: ${calc.label}`);
  };

  return (
    <Card>
      <div className="p-8 space-y-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Gratuity Calculator (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Uses the common formula: (15/26) × last drawn (Basic + DA) × completed years (months ≥ 6 rounds up).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Last Drawn Basic + DA (Monthly) (₹)"
              type="number"
              value={lastDrawnBasicDa || ''}
              onChange={(e) => setLastDrawnBasicDa(Number(e.target.value))}
              placeholder="e.g. 50000"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Years of service" type="number" value={years || ''} onChange={(e) => setYears(Number(e.target.value))} />
              <Input
                label="Additional months"
                type="number"
                value={months || ''}
                onChange={(e) => setMonths(Number(e.target.value))}
                placeholder="0-11"
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Estimated Gratuity</p>
              <div className="text-4xl font-black mt-2">{rupee(res.gratuity)}</div>
              <p className="text-xs text-white/70 mt-3 font-semibold">
                Completed years used: <span className="font-black text-white">{res.completedYears}</span>
              </p>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Actual eligibility and caps can apply. This is a simplified estimator.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GratuityCalculator;

