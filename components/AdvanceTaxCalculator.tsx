import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface AdvanceTaxCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const AdvanceTaxCalculator: React.FC<AdvanceTaxCalculatorProps> = ({ user, onSave }) => {
  const [taxLiability, setTaxLiability] = useState(0);
  const [paidJun, setPaidJun] = useState(0);
  const [paidSep, setPaidSep] = useState(0);
  const [paidDec, setPaidDec] = useState(0);
  const [paidMar, setPaidMar] = useState(0);
  const [monthsDelayAfterMar, setMonthsDelayAfterMar] = useState(0);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const liability = Math.max(0, taxLiability);
    const installments = [
      { key: 'Jun 15 (15%)', pct: 0.15, months: 3 },
      { key: 'Sep 15 (45%)', pct: 0.45, months: 3 },
      { key: 'Dec 15 (75%)', pct: 0.75, months: 3 },
      { key: 'Mar 15 (100%)', pct: 1.0, months: 1 },
    ];

    const pays = [paidJun, paidSep, paidDec, paidMar].map((n) => Math.max(0, n));
    const cumulativePaid = [pays[0], pays[0] + pays[1], pays[0] + pays[1] + pays[2], pays[0] + pays[1] + pays[2] + pays[3]];

    const required = installments.map((i) => liability * i.pct);
    const shortfalls = required.map((req, idx) => Math.max(0, req - cumulativePaid[idx]));
    const interest234C = shortfalls.reduce((sum, s, idx) => sum + s * 0.01 * installments[idx].months, 0);

    const totalAdvancePaid = cumulativePaid[3];
    const balanceTax = Math.max(0, liability - totalAdvancePaid);
    const shouldApply234B = totalAdvancePaid < liability * 0.9 && balanceTax > 0;
    const monthsB = Math.max(0, Math.floor(monthsDelayAfterMar));
    const interest234B = shouldApply234B ? balanceTax * 0.01 * monthsB : 0;

    return {
      liability,
      required,
      cumulativePaid,
      shortfalls,
      interest234C,
      balanceTax,
      interest234B,
      totalInterest: interest234C + interest234B,
    };
  }, [monthsDelayAfterMar, paidDec, paidJun, paidMar, paidSep, taxLiability]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Advance Tax ${new Date().toLocaleDateString()}`,
      type: 'ADVANCE_TAX',
      timestamp: Date.now(),
      inputs: { taxLiability, paidJun, paidSep, paidDec, paidMar, monthsDelayAfterMar },
      results: {
        taxLiability: res.liability,
        interest234C: res.interest234C,
        interest234B: res.interest234B,
        totalInterest: res.totalInterest,
        balanceTax: res.balanceTax,
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Advance Tax & Interest (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Enter your net tax liability (after TDS/credits) and advance tax paid by installment.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Net Tax Liability for FY (after TDS) (₹)"
              type="number"
              value={taxLiability || ''}
              onChange={(e) => setTaxLiability(Number(e.target.value))}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Paid by Jun 15 (₹)" type="number" value={paidJun || ''} onChange={(e) => setPaidJun(Number(e.target.value))} />
              <Input label="Paid by Sep 15 (₹)" type="number" value={paidSep || ''} onChange={(e) => setPaidSep(Number(e.target.value))} />
              <Input label="Paid by Dec 15 (₹)" type="number" value={paidDec || ''} onChange={(e) => setPaidDec(Number(e.target.value))} />
              <Input label="Paid by Mar 15 (₹)" type="number" value={paidMar || ''} onChange={(e) => setPaidMar(Number(e.target.value))} />
            </div>

            <Input
              label="Months delay after Mar 31 for balance tax payment (234B estimate)"
              type="number"
              value={monthsDelayAfterMar || ''}
              onChange={(e) => setMonthsDelayAfterMar(Number(e.target.value))}
              placeholder="e.g. 0, 1, 2..."
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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Total Interest (Estimate)</p>
              <div className="text-4xl font-black mt-2">{rupee(res.totalInterest)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">234C</div>
                  <div className="text-lg font-black mt-1">{rupee(res.interest234C)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">234B</div>
                  <div className="text-lg font-black mt-1">{rupee(res.interest234B)}</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-white/70 font-semibold">
                Balance tax after advance payments: <span className="font-black text-white">{rupee(res.balanceTax)}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Installment Shortfalls</p>
              </div>
              <div className="p-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Due</th>
                      <th className="py-2 pr-4">Required (cum.)</th>
                      <th className="py-2 pr-4">Paid (cum.)</th>
                      <th className="py-2">Shortfall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {['Jun 15 (15%)', 'Sep 15 (45%)', 'Dec 15 (75%)', 'Mar 15 (100%)'].map((k, idx) => (
                      <tr key={k}>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{k}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{rupee(res.required[idx] || 0)}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{rupee(res.cumulativePaid[idx] || 0)}</td>
                        <td className="py-3 font-black text-amber-600 dark:text-amber-300">{rupee(res.shortfalls[idx] || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Interest rules are simplified. Please verify for your exact case/FY.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdvanceTaxCalculator;

