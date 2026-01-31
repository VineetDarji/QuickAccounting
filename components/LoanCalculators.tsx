
import React, { useState } from 'react';
import { User, SavedCalculation } from '../types';

interface LoanCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const LoanCalculator: React.FC<LoanCalculatorProps> = ({ user, onSave }) => {
  const [loanType, setLoanType] = useState<'HOME' | 'AUTO' | 'PERSONAL'>('HOME');
  const [amount, setAmount] = useState(2500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [label, setLabel] = useState('');

  const applyPreset = (type: 'HOME' | 'AUTO' | 'PERSONAL') => {
    setLoanType(type);
    if (type === 'HOME') { setAmount(2500000); setRate(8.5); setTenure(20); }
    if (type === 'AUTO') { setAmount(800000); setRate(10.5); setTenure(5); }
    if (type === 'PERSONAL') { setAmount(200000); setRate(14); setTenure(3); }
  };

  const calculateEmi = () => {
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const emi = amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    return { emi, totalPayable, totalInterest: totalPayable - amount };
  };

  const res = calculateEmi();

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `${loanType} Loan ₹${amount}`,
      type: 'EMI',
      timestamp: Date.now(),
      inputs: { amount, rate, tenure, loanType },
      results: res
    });
    setLabel('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3"><span className="p-2 bg-indigo-50 dark:bg-indigo-900 rounded-lg">🏠</span> EMI Planning</h3>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl">
            {['HOME', 'AUTO', 'PERSONAL'].map(t => (
                <button 
                  key={t}
                  onClick={() => applyPreset(t as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${loanType === t ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {t}
                </button>
            ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Principal Amount</span><span className="font-bold text-indigo-600 dark:text-indigo-400">₹{amount.toLocaleString()}</span></div>
            <input type="range" min="10000" max="10000000" step="50000" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Annual Interest</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{rate}%</span></div>
            <input type="range" min="1" max="25" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500">Tenure (Years)</span><span className="font-bold text-indigo-600 dark:text-indigo-400">{tenure}</span></div>
            <input type="range" min="1" max="30" step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          {user && (
            <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario name..." className="flex-1 p-3 border rounded-xl text-sm outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">Save</button>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-center text-center shadow-2xl">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Installment</p>
            <p className="text-5xl font-black mb-8 text-white">₹{res.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                <div className="text-left">
                    <p className="text-[10px] text-white/40 uppercase font-black">Principal</p>
                    <p className="text-lg font-bold text-white">₹{amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase font-black">Total Interest</p>
                    <p className="text-lg font-bold text-indigo-400">₹{res.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
                 <p className="text-[10px] text-white/30 uppercase font-black mb-1">Total Amount Payable</p>
                 <p className="text-2xl font-black text-white">₹{res.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;
