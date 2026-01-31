
import React, { useState, useEffect } from 'react';
import { TaxRegime, AgeGroup, TaxCalculationResult, User, SavedCalculation } from '../types';
import { NEW_REGIME_SLABS_24_25, OLD_REGIME_SLABS_24_25 } from '../constants';

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
      userEmail: user.email,
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
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-8">
        <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <span className="p-2 bg-indigo-100 rounded-xl text-2xl">⚖️</span> 
          Compare Tax Regimes
        </h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Financial Inputs</label>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Annual Gross Income (₹)</label>
                        <input type="number" value={income || ''} onChange={e => setIncome(Number(e.target.value))} className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl text-xl font-bold focus:border-indigo-600 outline-none transition-all" placeholder="e.g. 15,00,000" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Total Deductions (Old Regime Only)</label>
                        <input type="number" value={deductions || ''} onChange={e => setDeductions(Number(e.target.value))} className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl text-xl font-bold focus:border-indigo-600 outline-none transition-all" placeholder="80C, 80D, HRA etc." />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {[{l: '< 60', v: AgeGroup.NORMAL}, {l: '60-80', v: AgeGroup.SENIOR}, {l: '> 80', v: AgeGroup.SUPER_SENIOR}].map(g => (
                    <button key={g.v} onClick={() => setAgeGroup(g.v)} className={`py-3 rounded-xl text-xs font-black uppercase transition-all ${ageGroup === g.v ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {g.l}
                    </button>
                ))}
            </div>

            {user ? (
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Save to Profile</label>
                    <div className="flex gap-2">
                        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Name this scenario..." className="flex-1 p-3 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md">Save</button>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <p className="text-xs text-amber-800 font-bold leading-tight">Login required to save and export reports.</p>
                </div>
            )}
          </div>

          {/* Results Side-by-Side */}
          <div className="grid grid-cols-2 gap-4 h-fit">
            <div className={`p-6 rounded-3xl border-2 transition-all ${betterRegime === 'OLD' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                <div className="text-center mb-6">
                    <span className="text-[10px] font-black uppercase text-slate-400">Old Regime</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">₹{oldRes.totalTax.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex justify-between"><span>Taxable:</span><span className="font-bold">₹{oldRes.taxableIncome.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Cess:</span><span className="font-bold">₹{oldRes.cess.toLocaleString()}</span></div>
                </div>
            </div>

            <div className={`p-6 rounded-3xl border-2 transition-all ${betterRegime === 'NEW' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                <div className="text-center mb-6">
                    <span className="text-[10px] font-black uppercase text-slate-400">New Regime</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">₹{newRes.totalTax.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex justify-between"><span>Taxable:</span><span className="font-bold">₹{newRes.taxableIncome.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Cess:</span><span className="font-bold">₹{newRes.cess.toLocaleString()}</span></div>
                </div>
            </div>

            <div className="col-span-2 mt-4">
                <div className="bg-indigo-900 text-white p-6 rounded-3xl text-center shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Recommended Choice</p>
                        <h4 className="text-2xl font-black mb-2 text-white">{betterRegime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}</h4>
                        <div className="inline-block px-4 py-2 bg-white/10 rounded-full font-bold text-sm">
                            Potential Annual Savings: <span className="text-green-400 text-lg">₹{savings.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;
