
import React, { useState } from 'react';
import { User, SavedCalculation } from '../types';

interface ToolProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

export const SipCalculator: React.FC<ToolProps> = ({ user, onSave }) => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [label, setLabel] = useState('');

  const calculate = () => {
    const i = rate / 100 / 12;
    const n = years * 12;
    const maturity = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = monthly * n;
    return { maturity, invested, wealth: maturity - invested };
  };

  const res = calculate();

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `SIP ${monthly}/m for ${years}y`,
      type: 'SIP',
      timestamp: Date.now(),
      inputs: { monthly, rate, years },
      results: res
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-indigo-50 rounded-lg">💎</span> SIP Wealth Builder</h3>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Monthly Deposit</span><span className="font-bold text-indigo-600">₹{monthly.toLocaleString()}</span></div>
            <input type="range" min="500" max="100000" step="500" value={monthly} onChange={e => setMonthly(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Expected Returns</span><span className="font-bold text-indigo-600">{rate}%</span></div>
            <input type="range" min="1" max="30" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Duration</span><span className="font-bold text-indigo-600">{years} Years</span></div>
            <input type="range" min="1" max="40" step="1" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          {user && (
            <div className="flex gap-2 pt-4">
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario name..." className="flex-1 p-3 border rounded-xl text-sm outline-none" />
              <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
            </div>
          )}
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white text-center shadow-2xl relative overflow-hidden">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Maturity Value</p>
            <p className="text-5xl font-black mb-8">₹{res.maturity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
                <div><p className="text-[10px] text-white/40 uppercase font-black">Invested</p><p className="font-bold">₹{res.invested.toLocaleString()}</p></div>
                <div><p className="text-[10px] text-white/40 uppercase font-black">Est. Returns</p><p className="font-bold text-green-400">₹{res.wealth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p></div>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export const LumpsumCalculator: React.FC<ToolProps> = ({ user, onSave }) => {
  const [invested, setInvested] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [label, setLabel] = useState('');

  const calculate = () => {
    const maturity = invested * Math.pow(1 + rate / 100, years);
    return { maturity, wealth: maturity - invested };
  };

  const res = calculate();

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `Lumpsum ${invested} @ ${rate}%`,
      type: 'LUMPSUM',
      timestamp: Date.now(),
      inputs: { invested, rate, years },
      results: res
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-indigo-50 rounded-lg">💰</span> Lumpsum Growth</h3>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Total Capital</span><span className="font-bold text-indigo-600">₹{invested.toLocaleString()}</span></div>
            <input type="range" min="5000" max="5000000" step="5000" value={invested} onChange={e => setInvested(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Annual Return</span><span className="font-bold text-indigo-600">{rate}%</span></div>
            <input type="range" min="1" max="30" step="0.5" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          <div>
            <div className="flex justify-between mb-4"><span className="text-xs font-black uppercase text-slate-400">Years</span><span className="font-bold text-indigo-600">{years}</span></div>
            <input type="range" min="1" max="40" step="1" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
          </div>
          {user && (
            <div className="flex gap-2 pt-4">
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario..." className="flex-1 p-3 border rounded-xl text-sm outline-none" />
              <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
            </div>
          )}
        </div>
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white text-center shadow-2xl relative">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Maturity Wealth</p>
            <p className="text-5xl font-black mb-8">₹{res.maturity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <div className="p-6 bg-white/10 rounded-3xl border border-white/20">
                <p className="text-xs text-white/60 font-black uppercase mb-1">Total Net Profit</p>
                <p className="text-2xl font-black">₹{res.wealth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
        </div>
      </div>
    </div>
  );
};
