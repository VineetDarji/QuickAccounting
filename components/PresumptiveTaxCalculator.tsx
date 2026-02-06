import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface PresumptiveTaxCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const PresumptiveTaxCalculator: React.FC<PresumptiveTaxCalculatorProps> = ({ user, onSave }) => {
  const [scheme, setScheme] = useState<'44AD' | '44ADA' | '44AE'>('44AD');
  const [turnover, setTurnover] = useState(0);
  const [digitalTurnover, setDigitalTurnover] = useState(0);
  const [grossReceipts, setGrossReceipts] = useState(0);
  const [vehicleType, setVehicleType] = useState<'NON_HEAVY' | 'HEAVY'>('NON_HEAVY');
  const [vehicleCount, setVehicleCount] = useState(1);
  const [monthsOwned, setMonthsOwned] = useState(12);
  const [gvwTons, setGvwTons] = useState(16);
  const [label, setLabel] = useState('');

  const presumptiveIncome = useMemo(() => {
    if (scheme === '44ADA') return Math.max(0, grossReceipts) * 0.5;
    if (scheme === '44AE') {
      const count = Math.max(0, Math.floor(vehicleCount));
      const months = Math.max(0, Math.floor(monthsOwned));
      if (count === 0 || months === 0) return 0;
      if (vehicleType === 'HEAVY') return count * Math.max(0, gvwTons) * 1000 * months;
      return count * 7500 * months;
    }
    const t = Math.max(0, turnover);
    const d = Math.min(Math.max(0, digitalTurnover), t);
    const nonDigital = Math.max(0, t - d);
    return d * 0.06 + nonDigital * 0.08;
  }, [digitalTurnover, grossReceipts, gvwTons, monthsOwned, scheme, turnover, vehicleCount, vehicleType]);

  const effectivePct = useMemo(() => {
    const base = scheme === '44ADA' ? Math.max(0, grossReceipts) : scheme === '44AD' ? Math.max(0, turnover) : 0;
    if (base <= 0) return 0;
    return (presumptiveIncome / base) * 100;
  }, [grossReceipts, presumptiveIncome, scheme, turnover]);

  const handleSave = () => {
    if (!user) return;
    const inputs =
      scheme === '44ADA'
        ? { scheme, grossReceipts }
        : scheme === '44AE'
          ? { scheme, vehicleType, vehicleCount, monthsOwned, gvwTons }
        : { scheme, turnover, digitalTurnover, nonDigitalTurnover: Math.max(0, turnover - digitalTurnover) };

    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Presumptive ${scheme} ${new Date().toLocaleDateString()}`,
      type: 'PRESUMPTIVE_TAX',
      timestamp: Date.now(),
      inputs,
      results: { presumptiveIncome, effectivePct },
    };
    onSave?.(calc);
    setLabel('');
    toastConfig.success(`Saved: ${calc.label}`);
  };

  return (
    <Card>
      <div className="p-8 space-y-8">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Presumptive Income (44AD / 44ADA / 44AE)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Estimates presumptive income using common simplified rules (44AD: 6% digital / 8% others, 44ADA: 50%, 44AE: per-vehicle per-month).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Scheme</label>
              <select
                value={scheme}
                onChange={(e) => setScheme(e.target.value as any)}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
              >
                <option value="44AD">44AD - Business</option>
                <option value="44ADA">44ADA - Professional</option>
                <option value="44AE">44AE - Transport (Vehicles)</option>
              </select>
            </div>

            {scheme === '44AD' ? (
              <>
                <Input label="Total Turnover (₹)" type="number" value={turnover || ''} onChange={(e) => setTurnover(Number(e.target.value))} />
                <Input
                  label="Digital Receipts Portion (₹)"
                  type="number"
                  value={digitalTurnover || ''}
                  onChange={(e) => setDigitalTurnover(Number(e.target.value))}
                  placeholder="Optional"
                />
              </>
            ) : scheme === '44AE' ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                  >
                    <option value="NON_HEAVY">Other than heavy goods vehicle</option>
                    <option value="HEAVY">Heavy goods vehicle</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Number of vehicles" type="number" value={vehicleCount || ''} onChange={(e) => setVehicleCount(Number(e.target.value))} />
                  <Input label="Months owned in FY" type="number" value={monthsOwned || ''} onChange={(e) => setMonthsOwned(Number(e.target.value))} />
                </div>

                {vehicleType === 'HEAVY' && (
                  <Input
                    label="Avg. gross vehicle weight per vehicle (tons)"
                    type="number"
                    value={gvwTons || ''}
                    onChange={(e) => setGvwTons(Number(e.target.value))}
                  />
                )}
              </>
            ) : (
              <Input
                label="Gross Receipts (₹)"
                type="number"
                value={grossReceipts || ''}
                onChange={(e) => setGrossReceipts(Number(e.target.value))}
              />
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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Presumptive Income</p>
              <div className="text-4xl font-black mt-2">{rupee(presumptiveIncome)}</div>
              {scheme !== '44AE' && (
                <p className="text-xs text-white/70 mt-3 font-semibold">Effective rate: {effectivePct.toFixed(2)}%</p>
              )}
              <p className="text-xs text-white/70 mt-2 font-semibold">
                Use the Income Tax calculator to estimate final tax payable on this income.
              </p>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Presumptive taxation eligibility and rules can vary. This is a simplified estimate.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PresumptiveTaxCalculator;
