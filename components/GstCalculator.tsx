
import React, { useState } from 'react';
import { User, SavedCalculation } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';

interface GstCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const GstCalculator: React.FC<GstCalculatorProps> = ({ user, onSave }) => {
  const [amount, setAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState<boolean>(false);
  const [label, setLabel] = useState('');

  const calculate = () => {
    let gstAmount = 0;
    let totalAmount = 0;
    let netAmount = 0;

    if (isInclusive) {
      netAmount = amount / (1 + rate / 100);
      gstAmount = amount - netAmount;
      totalAmount = amount;
    } else {
      netAmount = amount;
      gstAmount = amount * (rate / 100);
      totalAmount = amount + gstAmount;
    }

    return { netAmount, gstAmount, totalAmount };
  };

  const { netAmount, gstAmount, totalAmount } = calculate();

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: user.email,
      label: label || `GST ${amount} @ ${rate}%`,
      type: 'GST',
      timestamp: Date.now(),
      inputs: { amount, rate, isInclusive },
      results: { netAmount, gstAmount, totalAmount }
    };
    onSave?.(calc);
    setLabel('');
  };

  return (
    <Card>
      <div className="p-8">
        <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <span className="p-2 bg-indigo-100 rounded-xl text-2xl">🛍️</span>
          GST Calculator
        </h2>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Base Value</label>
              <div className="space-y-4">
                <Input
                  label="Transaction Amount (₹)"
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">GST Rate (%)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 12, 18, 28].map(r => (
                      <Button key={r} onClick={() => setRate(r)} variant={rate === r ? 'primary' : 'secondary'} size="sm">
                        {r}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <Button onClick={() => setIsInclusive(false)} variant={!isInclusive ? 'primary' : 'ghost'} className="flex-1">Exclusive</Button>
              <Button onClick={() => setIsInclusive(true)} variant={isInclusive ? 'primary' : 'ghost'} className="flex-1">Inclusive</Button>
            </div>

            {user ? (
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Save Record</label>
                <div className="flex gap-2">
                  <Input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Scenario name..." className="flex-1" />
                  <Button onClick={handleSave} size="sm">Save</Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <p className="text-xs text-amber-800 font-bold">Login to save and download GST reports.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Total Bill Amount</p>
              <div className="text-4xl font-black mb-6 text-white">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Net Value (Pre-Tax)</span>
                  <span className="font-bold text-white">₹{netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">GST ({rate}%)</span>
                  <span className="font-bold text-indigo-400">₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl">
              <h4 className="text-indigo-900 font-bold mb-2 text-sm">GST Components</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] uppercase font-black text-slate-400">CGST ({(rate / 2)}%)</p>
                  <p className="font-bold text-slate-800">₹{(gstAmount / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] uppercase font-black text-slate-400">SGST ({(rate / 2)}%)</p>
                  <p className="font-bold text-slate-800">₹{(gstAmount / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GstCalculator;
