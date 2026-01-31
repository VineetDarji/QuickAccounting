
import React, { useState } from 'react';
import { User, SavedCalculation } from '../types';

interface ToolProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

export const HraCalculator: React.FC<ToolProps> = ({ user, onSave }) => {
  const [basic, setBasic] = useState(0);
  const [hraReceived, setHraReceived] = useState(0);
  const [rentPaid, setRentPaid] = useState(0);
  const [isMetro, setIsMetro] = useState(true);
  const [label, setLabel] = useState('');

  const calculateHra = () => {
    const rule1 = hraReceived;
    const rule2 = isMetro ? basic * 0.5 : basic * 0.4;
    const rule3 = Math.max(0, rentPaid - (basic * 0.1));
    return Math.min(rule1, rule2, rule3);
  };

  const exempt = calculateHra();

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `HRA ${rentPaid}`,
      type: 'INCOME_TAX',
      timestamp: Date.now(),
      inputs: { basic, hraReceived, rentPaid, isMetro },
      results: { exemptAmount: exempt, taxableAmount: hraReceived - exempt }
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-indigo-50 rounded-lg">🏠</span> HRA Exemption</h3>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Basic Salary + DA (Annual)</label>
              <input type="number" value={basic || ''} onChange={e => setBasic(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">HRA Received</label>
                <input type="number" value={hraReceived || ''} onChange={e => setHraReceived(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Rent Paid (Annual)</label>
                <input type="number" value={rentPaid || ''} onChange={e => setRentPaid(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
              </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setIsMetro(true)} className={`flex-1 py-3 rounded-xl text-sm font-bold ${isMetro ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Metro</button>
              <button onClick={() => setIsMetro(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold ${!isMetro ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Non-Metro</button>
            </div>
            {user && (
              <div className="flex gap-2 pt-4">
                <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Label..." className="flex-1 p-3 border rounded-xl text-sm outline-none bg-white text-slate-900" />
                <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
              </div>
            )}
        </div>
        <div className="bg-indigo-900 rounded-[2rem] p-8 text-white flex flex-col justify-center text-center shadow-xl">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Exempt Amount</p>
            <p className="text-5xl font-black mb-6 text-white">₹{exempt.toLocaleString('en-IN')}</p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-indigo-300 font-bold mb-1">Taxable Portion</p>
                <p className="text-xl font-bold text-white">₹{(hraReceived - exempt).toLocaleString('en-IN')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export const TdsCalculator: React.FC<ToolProps> = ({ user, onSave }) => {
  const [amount, setAmount] = useState(0);
  const [section, setSection] = useState('10');
  const [label, setLabel] = useState('');

  const tds = amount * (parseFloat(section) / 100);

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `TDS Section ${section}`,
      type: 'INCOME_TAX',
      timestamp: Date.now(),
      inputs: { amount, section },
      results: { tdsAmount: tds, netPayable: amount - tds }
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-amber-50 rounded-lg">🏦</span> TDS Estimator</h3>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Payment Gross Amount</label>
              <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Applicable Section</label>
              <select value={section} onChange={e => setSection(e.target.value)} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none">
                <option value="10">194J - Professional (10%)</option>
                <option value="2">194J - Tech Service (2%)</option>
                <option value="5">194C - Contract (5%)</option>
                <option value="1">192 - Salary (Estimated 1%)</option>
              </select>
            </div>
            {user && (
              <div className="flex gap-2 pt-4">
                <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario..." className="flex-1 p-3 border rounded-xl text-sm outline-none bg-white text-slate-900" />
                <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
              </div>
            )}
        </div>
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-center text-center shadow-2xl">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">TDS Deductible</p>
            <p className="text-5xl font-black text-amber-400 mb-6">₹{tds.toLocaleString('en-IN')}</p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-400 font-bold mb-1">Net to Payee</p>
                <p className="text-xl font-bold text-white">₹{(amount - tds).toLocaleString('en-IN')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export const NscCalculator: React.FC<ToolProps> = ({ user, onSave }) => {
  const [invested, setInvested] = useState(100000);
  const [label, setLabel] = useState('');
  const rate = 7.7;

  const maturity = invested * Math.pow(1 + rate / 100, 5);

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `NSC Invest ${invested}`,
      type: 'INCOME_TAX',
      timestamp: Date.now(),
      inputs: { invested, rate },
      results: { maturityValue: maturity, interestEarned: maturity - invested }
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-green-50 rounded-lg">📜</span> NSC Maturity</h3>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Investment Amount</label>
              <input type="number" value={invested || ''} onChange={e => setInvested(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between mb-2"><span className="text-xs text-slate-500 font-bold">Rate</span><span className="text-sm font-black text-slate-900">{rate}% p.a.</span></div>
                <div className="flex justify-between"><span className="text-xs text-slate-500 font-bold">Lock-in</span><span className="text-sm font-black text-slate-900">5 Years</span></div>
            </div>
            {user && (
              <div className="flex gap-2 pt-4">
                <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario..." className="flex-1 p-3 border rounded-xl text-sm outline-none bg-white text-slate-900" />
                <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
              </div>
            )}
        </div>
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex flex-col justify-center text-center shadow-xl">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Maturity Amount</p>
            <p className="text-5xl font-black mb-6 text-white">₹{maturity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            <div className="p-4 bg-white/10 rounded-2xl">
                <p className="text-xs text-white/60 font-bold mb-1">Interest Earned</p>
                <p className="text-xl font-bold text-white">₹{(maturity - invested).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
        </div>
      </div>
    </div>
  );
};
