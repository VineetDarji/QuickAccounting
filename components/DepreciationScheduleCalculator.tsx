import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface DepreciationScheduleCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

type DepMethod = 'WDV' | 'SLM';

const DepreciationScheduleCalculator: React.FC<DepreciationScheduleCalculatorProps> = ({ user, onSave }) => {
  const [cost, setCost] = useState(0);
  const [method, setMethod] = useState<DepMethod>('WDV');
  const [ratePct, setRatePct] = useState(15);
  const [years, setYears] = useState(5);
  const [salvage, setSalvage] = useState(0);
  const [label, setLabel] = useState('');

  const schedule = useMemo(() => {
    const rows: { year: number; opening: number; depreciation: number; closing: number }[] = [];
    const y = Math.max(1, Math.floor(years));
    const r = Math.max(0, ratePct) / 100;
    let opening = Math.max(0, cost);
    const sv = Math.max(0, salvage);

    if (method === 'SLM') {
      const depPerYear = y > 0 ? Math.max(0, (opening - sv) / y) : 0;
      for (let i = 1; i <= y; i += 1) {
        const maxDep = Math.max(0, opening - sv);
        const depreciation = i === y ? maxDep : Math.min(depPerYear, maxDep);
        const closing = Math.max(sv, opening - depreciation);
        rows.push({ year: i, opening, depreciation, closing });
        opening = closing;
      }
      return rows;
    }

    for (let i = 1; i <= y; i += 1) {
      const depreciation = opening * r;
      const closing = Math.max(0, opening - depreciation);
      rows.push({ year: i, opening, depreciation, closing });
      opening = closing;
    }
    return rows;
  }, [cost, method, ratePct, salvage, years]);

  const summary = useMemo(() => {
    const totalDepreciation = schedule.reduce((s, r) => s + r.depreciation, 0);
    const closingValue = schedule.length ? schedule[schedule.length - 1].closing : Math.max(0, cost);
    return { totalDepreciation, closingValue };
  }, [cost, schedule]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Depreciation ${new Date().toLocaleDateString()}`,
      type: 'DEPRECIATION',
      timestamp: Date.now(),
      inputs: { cost, method, ratePct, years, salvage },
      results: {
        totalDepreciation: summary.totalDepreciation,
        closingValue: summary.closingValue,
        years: Math.max(1, Math.floor(years)),
        ratePct,
        method,
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Depreciation Schedule (Generic)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Generates a simple WDV or SLM depreciation table. Choose a rate and years to project.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input label="Asset Cost (₹)" type="number" value={cost || ''} onChange={(e) => setCost(Number(e.target.value))} />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as DepMethod)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                >
                  <option value="WDV">WDV</option>
                  <option value="SLM">SLM</option>
                </select>
              </div>
              <Input label="Rate (% per year)" type="number" value={ratePct || ''} onChange={(e) => setRatePct(Number(e.target.value))} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Years to project" type="number" value={years || ''} onChange={(e) => setYears(Number(e.target.value))} />
              <Input label="Salvage value (SLM only) (₹)" type="number" value={salvage || ''} onChange={(e) => setSalvage(Number(e.target.value))} />
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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Summary</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Total Depreciation</div>
                  <div className="text-xl font-black mt-1">{rupee(summary.totalDepreciation)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 text-xs font-black uppercase">Closing Value</div>
                  <div className="text-xl font-black mt-1">{rupee(summary.closingValue)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule</p>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Year</th>
                      <th className="py-2 pr-4">Opening</th>
                      <th className="py-2 pr-4">Depreciation</th>
                      <th className="py-2">Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {schedule.map((r) => (
                      <tr key={r.year}>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{r.year}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{rupee(r.opening)}</td>
                        <td className="py-3 pr-4 font-black text-amber-600 dark:text-amber-300">{rupee(r.depreciation)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{rupee(r.closing)}</td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 font-bold">
                          Enter values to generate a schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DepreciationScheduleCalculator;

