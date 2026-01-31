
import React, { useState } from 'react';
import { User, SavedCalculation } from '../types';

interface CapitalGainsCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const CapitalGainsCalculator: React.FC<CapitalGainsCalculatorProps> = ({ user, onSave }) => {
  const [assetType, setAssetType] = useState<'EQUITY' | 'PROPERTY'>('EQUITY');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [holdingPeriodMonths, setHoldingPeriodMonths] = useState<number>(0);
  const [label, setLabel] = useState('');

  const calculateGains = () => {
    const gain = Math.max(0, sellPrice - buyPrice);
    let isLongTerm = false;
    let taxRate = 0;
    
    if (assetType === 'EQUITY') {
      isLongTerm = holdingPeriodMonths > 12;
      taxRate = isLongTerm ? 0.125 : 0.20;
    } else {
      isLongTerm = holdingPeriodMonths > 24;
      taxRate = isLongTerm ? 0.125 : 0.30;
    }

    let taxableGain = gain;
    if (assetType === 'EQUITY' && isLongTerm) {
      taxableGain = Math.max(0, gain - 125000);
    }

    const estimatedTax = taxableGain * taxRate;
    return { gain, isLongTerm, estimatedTax, taxRate, taxableGain };
  };

  const res = calculateGains();

  const handleSave = () => {
    if (!user) return;
    onSave?.({
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `${assetType} Gains ${res.gain}`,
      type: 'CAPITAL_GAINS',
      timestamp: Date.now(),
      inputs: { assetType, buyPrice, sellPrice, holdingPeriodMonths },
      results: res
    });
    setLabel('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-8">
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><span className="p-2 bg-indigo-50 rounded-lg">📈</span> Capital Gains Estimator</h2>
      
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button onClick={() => setAssetType('EQUITY')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${assetType === 'EQUITY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Equity / Mutual Funds</button>
              <button onClick={() => setAssetType('PROPERTY')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${assetType === 'PROPERTY' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Real Estate</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Buy Price (₹)</label>
                <input type="number" value={buyPrice || ''} onChange={e => setBuyPrice(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Sell Price (₹)</label>
                <input type="number" value={sellPrice || ''} onChange={e => setSellPrice(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Holding Period (Months)</label>
              <input type="number" value={holdingPeriodMonths || ''} onChange={e => setHoldingPeriodMonths(Number(e.target.value))} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none" />
            </div>

            {user && (
              <div className="pt-4 border-t border-slate-50">
                  <div className="flex gap-2">
                      <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario name..." className="flex-1 p-3 border rounded-xl text-sm outline-none" />
                      <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">Save</button>
                  </div>
              </div>
            )}
        </div>

        <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-center text-center shadow-2xl relative overflow-hidden">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Estimated Tax</p>
            <p className="text-5xl font-black mb-6">₹{res.estimatedTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            
            <div className="space-y-4 border-t border-white/10 pt-8">
                <div className="flex justify-between items-center"><span className="text-white/40 text-xs font-bold uppercase">Total Gains</span><span className="font-black text-lg">₹{res.gain.toLocaleString()}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/40 text-xs font-bold uppercase">Tax Type</span><span className="font-black text-indigo-400">{res.isLongTerm ? 'LONG TERM (LTCG)' : 'SHORT TERM (STCG)'}</span></div>
                <div className="flex justify-between items-center"><span className="text-white/40 text-xs font-black uppercase">Tax Rate</span><span className="font-black">{(res.taxRate*100).toFixed(1)}%</span></div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default CapitalGainsCalculator;
