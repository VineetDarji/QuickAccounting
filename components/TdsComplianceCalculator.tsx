import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface TdsComplianceCalculatorProps {
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

// "Month or part of month" estimator: counts the number of calendar months touched in (start, end].
const monthsTouched = (start: string, end: string) => {
  const a = parseDate(start);
  const b = parseDate(end);
  if (!a || !b) return 0;
  if (b.getTime() <= a.getTime()) return 0;
  const startIndex = a.getFullYear() * 12 + a.getMonth();
  const endIndex = b.getFullYear() * 12 + b.getMonth();
  return Math.max(0, endIndex - startIndex + 1);
};

const TdsComplianceCalculator: React.FC<TdsComplianceCalculatorProps> = ({ user, onSave }) => {
  const [tdsAmount, setTdsAmount] = useState(0);
  const [dateDeductible, setDateDeductible] = useState('');
  const [dateDeducted, setDateDeducted] = useState('');
  const [datePaid, setDatePaid] = useState('');
  const [returnDue, setReturnDue] = useState('');
  const [returnFiled, setReturnFiled] = useState('');
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const amt = Math.max(0, tdsAmount);
    const m1 = monthsTouched(dateDeductible, dateDeducted);
    const m2 = monthsTouched(dateDeducted, datePaid);
    const interest1 = amt * 0.01 * m1;
    const interest2 = amt * 0.015 * m2;
    const totalInterest = interest1 + interest2;

    const dLate = daysLate(returnDue, returnFiled);
    const fee234e = Math.min(dLate * 200, amt);

    return {
      months1: m1,
      months2: m2,
      interest1,
      interest2,
      totalInterest,
      daysLate: dLate,
      fee234e,
      totalExtras: totalInterest + fee234e,
    };
  }, [dateDeducted, dateDeductible, datePaid, returnDue, returnFiled, tdsAmount]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `TDS Compliance ${new Date().toLocaleDateString()}`,
      type: 'TDS_COMPLIANCE',
      timestamp: Date.now(),
      inputs: { tdsAmount, dateDeductible, dateDeducted, datePaid, returnDue, returnFiled },
      results: {
        interestPart1: res.interest1,
        interestPart2: res.interest2,
        totalInterest: res.totalInterest,
        fee234E: res.fee234e,
        totalExtras: res.totalExtras,
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">TDS Interest & 234E (Estimate)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Simplified interest estimate: 1% per month (or part) till deduction, 1.5% per month (or part) till payment,
            plus 234E late fee (200/day, capped at TDS amount).
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input label="TDS Amount (₹)" type="number" value={tdsAmount || ''} onChange={(e) => setTdsAmount(Number(e.target.value))} />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date Tax Deductible</label>
                <input
                  type="date"
                  value={dateDeductible}
                  onChange={(e) => setDateDeductible(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date Deducted</label>
                <input
                  type="date"
                  value={dateDeducted}
                  onChange={(e) => setDateDeducted(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Date Paid to Govt.</label>
                <input
                  type="date"
                  value={datePaid}
                  onChange={(e) => setDatePaid(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">TDS Return Due Date</label>
                <input
                  type="date"
                  value={returnDue}
                  onChange={(e) => setReturnDue(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Return Filed Date</label>
                <input
                  type="date"
                  value={returnFiled}
                  onChange={(e) => setReturnFiled(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                />
              </div>
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
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">Estimated Extras</p>
              <div className="text-4xl font-black mt-2">{rupee(res.totalExtras)}</div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">Interest (Total)</div>
                  <div className="text-lg font-black mt-1">{rupee(res.totalInterest)}</div>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="text-white/60 font-black uppercase">Fee (234E)</div>
                  <div className="text-lg font-black mt-1">{rupee(res.fee234e)}</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-white/70 font-semibold">
                Months counted: 1% = <span className="font-black text-white">{res.months1}</span>, 1.5% ={' '}
                <span className="font-black text-white">{res.months2}</span>
              </div>
              <div className="mt-2 text-xs text-white/70 font-semibold">
                Days late (return): <span className="font-black text-white">{res.daysLate}</span>
              </div>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: This is a simplified estimator. Actual interest/fee depends on rules and your exact dates.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TdsComplianceCalculator;

