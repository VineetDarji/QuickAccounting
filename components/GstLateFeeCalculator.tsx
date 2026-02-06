import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface GstLateFeeCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const parseDate = (value: string) => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysLate = (due: string, filed: string) => {
  const a = parseDate(due);
  const b = parseDate(filed);
  if (!a || !b) return 0;
  const diff = Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const GstLateFeeCalculator: React.FC<GstLateFeeCalculatorProps> = ({ user, onSave }) => {
  const [returnType, setReturnType] = useState<'GSTR3B' | 'GSTR1'>('GSTR3B');
  const [dueDate, setDueDate] = useState('');
  const [filedDate, setFiledDate] = useState('');
  const [isNil, setIsNil] = useState(false);
  const [taxPayable, setTaxPayable] = useState(0);
  const [interestRate, setInterestRate] = useState(18);
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const days = daysLate(dueDate, filedDate);

    const cap = 10000;
    const perDay =
      returnType === 'GSTR3B'
        ? isNil
          ? 20
          : 50
        : isNil
          ? 50
          : 200;

    const lateFee = Math.min(days * perDay, cap);

    const interest =
      returnType === 'GSTR3B' && days > 0
        ? Math.max(0, taxPayable) * (Math.max(0, interestRate) / 100) * (days / 365)
        : 0;

    return { days, perDay, cap, lateFee, interest, total: lateFee + interest };
  }, [dueDate, filedDate, interestRate, isNil, returnType, taxPayable]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `GST Late Fee ${new Date().toLocaleDateString()}`,
      type: 'GST_LATE_FEE',
      timestamp: Date.now(),
      inputs: { returnType, dueDate, filedDate, isNil, taxPayable, interestRate },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">GST Late Fee & Interest (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Calculates a simplified late fee and interest estimate based on due date vs filing date.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Return Type</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as any)}
                className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
              >
                <option value="GSTR3B">GSTR-3B</option>
                <option value="GSTR1">GSTR-1</option>
              </select>
            </div>

            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={isNil} onChange={(e) => setIsNil(e.target.checked)} />
              Nil return
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Filing Date</label>
                <input
                  type="date"
                  value={filedDate}
                  onChange={(e) => setFiledDate(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <Input
              label="Tax Payable (for interest, mainly GSTR-3B) (₹)"
              type="number"
              value={taxPayable || ''}
              onChange={(e) => setTaxPayable(Number(e.target.value))}
            />

            <Input
              label="Interest rate (% p.a.)"
              type="number"
              value={interestRate || ''}
              onChange={(e) => setInterestRate(Number(e.target.value))}
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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Total Additional Amount</p>
              <div className="text-4xl font-black mt-2">{rupee(res.total)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">Late Fee</div>
                  <div className="text-lg font-black mt-1">{rupee(res.lateFee)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">Interest</div>
                  <div className="text-lg font-black mt-1">{rupee(res.interest)}</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-white/70 font-semibold">
                Days late: <span className="font-black text-white">{res.days}</span> (fee {rupee(res.perDay)}/day, capped at{' '}
                {rupee(res.cap)})
              </div>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Late fee/interest rules may change and can have special relief. This is a simplified estimate.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GstLateFeeCalculator;

