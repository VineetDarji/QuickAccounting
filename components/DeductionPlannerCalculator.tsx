import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface DeductionPlannerCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const DeductionPlannerCalculator: React.FC<DeductionPlannerCalculatorProps> = ({ user, onSave }) => {
  const [amount80c, setAmount80c] = useState(0);
  const [amount80dSelf, setAmount80dSelf] = useState(0);
  const [selfSenior, setSelfSenior] = useState<'NO' | 'YES'>('NO');
  const [amount80dParents, setAmount80dParents] = useState(0);
  const [parentsSenior, setParentsSenior] = useState<'NO' | 'YES'>('NO');
  const [label, setLabel] = useState('');

  const caps = useMemo(() => {
    const cap80c = 150000;
    const cap80dSelf = selfSenior === 'YES' ? 50000 : 25000;
    const cap80dParents = parentsSenior === 'YES' ? 50000 : 25000;
    return { cap80c, cap80dSelf, cap80dParents };
  }, [parentsSenior, selfSenior]);

  const res = useMemo(() => {
    const allowed80c = Math.min(Math.max(0, amount80c), caps.cap80c);
    const allowed80dSelf = Math.min(Math.max(0, amount80dSelf), caps.cap80dSelf);
    const allowed80dParents = Math.min(Math.max(0, amount80dParents), caps.cap80dParents);
    const totalAllowed = allowed80c + allowed80dSelf + allowed80dParents;
    return {
      allowed80c,
      remaining80c: Math.max(0, caps.cap80c - allowed80c),
      allowed80dSelf,
      remaining80dSelf: Math.max(0, caps.cap80dSelf - allowed80dSelf),
      allowed80dParents,
      remaining80dParents: Math.max(0, caps.cap80dParents - allowed80dParents),
      totalAllowed,
    };
  }, [amount80c, amount80dParents, amount80dSelf, caps.cap80c, caps.cap80dParents, caps.cap80dSelf]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `80C/80D Planner ${new Date().toLocaleDateString()}`,
      type: 'DEDUCTIONS',
      timestamp: Date.now(),
      inputs: { amount80c, amount80dSelf, selfSenior, amount80dParents, parentsSenior },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">80C / 80D Deduction Planner</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Quick estimate of eligible deductions and remaining limits.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <Input
              label="Section 80C Amount (₹)"
              type="number"
              value={amount80c || ''}
              onChange={(e) => setAmount80c(Number(e.target.value))}
              placeholder="e.g. 150000"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="80D (Self/Family) Premium (₹)"
                type="number"
                value={amount80dSelf || ''}
                onChange={(e) => setAmount80dSelf(Number(e.target.value))}
                placeholder="e.g. 25000"
              />
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Self/Family Senior?</label>
                <select
                  value={selfSenior}
                  onChange={(e) => setSelfSenior(e.target.value as any)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                >
                  <option value="NO">No</option>
                  <option value="YES">Yes</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="80D (Parents) Premium (₹)"
                type="number"
                value={amount80dParents || ''}
                onChange={(e) => setAmount80dParents(Number(e.target.value))}
                placeholder="e.g. 50000"
              />
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Parents Senior?</label>
                <select
                  value={parentsSenior}
                  onChange={(e) => setParentsSenior(e.target.value as any)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                >
                  <option value="NO">No</option>
                  <option value="YES">Yes</option>
                </select>
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
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl p-8 shadow-2xl">
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Total Eligible Deduction</p>
              <div className="text-4xl font-black mt-2">{rupee(res.totalAllowed)}</div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">80C Allowed</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-2">{rupee(res.allowed80c)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Remaining: {rupee(res.remaining80c)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">80D (Self)</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-2">{rupee(res.allowed80dSelf)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Remaining: {rupee(res.remaining80dSelf)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">80D (Parents)</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-2">{rupee(res.allowed80dParents)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Remaining: {rupee(res.remaining80dParents)}</p>
              </div>
            </div>

            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: This is a simplified planner. Limits vary by conditions and FY rules.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeductionPlannerCalculator;

