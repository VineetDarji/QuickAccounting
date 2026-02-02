
import React, { useState, useEffect } from 'react';
import { TaxRegime, AgeGroup, TaxCalculationResult, User, SavedCalculation } from '../types';
import { NEW_REGIME_SLABS_24_25, OLD_REGIME_SLABS_24_25 } from '../constants';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface TaxCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const TaxCalculator: React.FC<TaxCalculatorProps> = ({ user, onSave }) => {
  const [income, setIncome] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.NORMAL);
  const [label, setLabel] = useState('');

  const calculateForRegime = (targetRegime: TaxRegime): TaxCalculationResult => {
    let taxableIncome = Math.max(0, income - (targetRegime === TaxRegime.OLD ? deductions : 0));
    if (taxableIncome > 50000) taxableIncome -= 50000;

    const slabs = targetRegime === TaxRegime.NEW ? NEW_REGIME_SLABS_24_25 : OLD_REGIME_SLABS_24_25(ageGroup);

    let tax = 0;
    let remainingIncome = taxableIncome;
    let prevLimit = 0;

    for (const slab of slabs) {
      const taxableInSlab = Math.min(Math.max(0, remainingIncome), slab.limit - prevLimit);
      tax += taxableInSlab * slab.rate;
      remainingIncome -= taxableInSlab;
      prevLimit = slab.limit;
      if (remainingIncome <= 0) break;
    }

    let rebate = 0;
    if (targetRegime === TaxRegime.NEW && taxableIncome <= 700000) rebate = tax;
    else if (targetRegime === TaxRegime.OLD && taxableIncome <= 500000) rebate = Math.min(tax, 12500);

    const netTax = Math.max(0, tax - rebate);
    const cess = netTax * 0.04;
    const totalTax = netTax + cess;

    return { taxableIncome, grossTax: tax, cess, rebate, totalTax, effectiveRate: income > 0 ? (totalTax / income) * 100 : 0 };
  };

  const oldRes = calculateForRegime(TaxRegime.OLD);
  const newRes = calculateForRegime(TaxRegime.NEW);
  const betterRegime = newRes.totalTax <= oldRes.totalTax ? 'NEW' : 'OLD';
  const savings = Math.abs(newRes.totalTax - oldRes.totalTax);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Tax Calculation ${new Date().toLocaleDateString()}`,
      type: 'INCOME_TAX',
      timestamp: Date.now(),
      inputs: { income, deductions, ageGroup },
      results: {
        oldRegimeTax: oldRes.totalTax,
        newRegimeTax: newRes.totalTax,
        recommended: betterRegime,
        potentialSavings: savings
      }
    };
    onSave?.(calc);
    setLabel('');
    toastConfig.success(`✅ Saved as "${calc.label}"`);
  };

  return (
    <Card>
      <div className="p-8 animate-scale-in">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          <span className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-2xl text-2xl transform group-hover:scale-110 transition-transform">⚖️</span>
          Compare Tax Regimes
        </h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm">
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-widest">📊 Financial Inputs</label>
              <div className="space-y-4">
                <Input
                  label="Annual Gross Income (₹)"
                  type="number"
                  value={income || ''}
                  onChange={e => setIncome(Number(e.target.value))}
                  placeholder="e.g. 15,00,000"
                />
                <Input
                  label="Total Deductions (Old Regime Only)"
                  type="number"
                  value={deductions || ''}
                  onChange={e => setDeductions(Number(e.target.value))}
                  placeholder="80C, 80D, HRA etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[{ l: '< 60', v: AgeGroup.NORMAL }, { l: '60-80', v: AgeGroup.SENIOR }, { l: '> 80', v: AgeGroup.SUPER_SENIOR }].map((g, idx) => (
                <Button key={g.v} onClick={() => setAgeGroup(g.v)} variant={ageGroup === g.v ? 'primary' : 'secondary'} size="sm">
                  {g.l}
                </Button>
              ))}
            </div>

            {user ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-2">💾 Save to Profile</label>
                <div className="flex gap-2">
                  <Input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Name this scenario..." className="flex-1" />
                  <Button onClick={handleSave} size="sm">Save</Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-amber-200 dark:border-slate-600 flex items-center gap-3 animate-pulse-soft">
                <span className="text-2xl">🔒</span>
                <p className="text-xs text-amber-900 dark:text-amber-300 font-bold leading-tight">Login required to save and export reports.</p>
              </div>
            )}
          </div>

          {/* Results Side-by-Side */}
          <div className="grid grid-cols-2 gap-4 h-fit">
            <div className={`p-6 rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 ${betterRegime === 'OLD' ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md'}`}>
              <div className="text-center mb-6">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Old Regime</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">₹{oldRes.totalTax.toLocaleString('en-IN')}</div>
              </div>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
                  <span>Taxable:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{oldRes.taxableIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
                  <span>Cess:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{oldRes.cess.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border-2 transition-all duration-300 transform hover:scale-105 ${betterRegime === 'NEW' ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md'}`}>
              <div className="text-center mb-6">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">New Regime</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">₹{newRes.totalTax.toLocaleString('en-IN')}</div>
              </div>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
                  <span>Taxable:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{newRes.taxableIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-white/50 dark:bg-slate-700/50 p-2 rounded-lg">
                  <span>Cess:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{newRes.cess.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 mt-4 animate-slide-up">
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-8 rounded-3xl shadow-2xl shadow-indigo-400/30 relative overflow-hidden border border-indigo-500/50">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse-soft"></div>
                <div className="relative z-10">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">✨ Recommended Choice</p>
                  <h4 className="text-3xl font-black mb-4 text-white">{betterRegime === 'NEW' ? '✓ New Tax Regime' : '✓ Old Tax Regime'}</h4>
                  <div className="inline-block px-6 py-3 bg-white/15 backdrop-blur-sm rounded-2xl font-bold text-sm border border-white/30">
                    Potential Annual Savings: <span className="text-green-300 text-2xl block mt-1">₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaxCalculator;
