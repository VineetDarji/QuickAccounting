import React, { useMemo, useState } from 'react';
import { SavedCalculation, User } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { toastConfig } from '../services/toastService';

interface GstRcmCalculatorProps {
  user: User | null;
  onSave?: (calc: SavedCalculation) => void;
}

const rupee = (n: number) => `${'\u20B9'}${Math.round(n).toLocaleString('en-IN')}`;

const GstRcmCalculator: React.FC<GstRcmCalculatorProps> = ({ user, onSave }) => {
  const [taxableValue, setTaxableValue] = useState(0);
  const [gstRate, setGstRate] = useState(18);
  const [supplyType, setSupplyType] = useState<'INTRA' | 'INTER'>('INTRA');
  const [label, setLabel] = useState('');

  const res = useMemo(() => {
    const value = Math.max(0, taxableValue);
    const tax = value * (Math.max(0, gstRate) / 100);
    if (supplyType === 'INTER') return { tax, igst: tax, cgst: 0, sgst: 0 };
    return { tax, igst: 0, cgst: tax / 2, sgst: tax / 2 };
  }, [gstRate, supplyType, taxableValue]);

  const handleSave = () => {
    if (!user) return;
    const calc: SavedCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      userName: user.name,
      label: label || `GST RCM ${new Date().toLocaleDateString()}`,
      type: 'GST_RCM',
      timestamp: Date.now(),
      inputs: { taxableValue, gstRate, supplyType },
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
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">GST Reverse Charge (RCM) Calculator</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Calculates GST payable under reverse charge for a taxable value.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Input
              label="Taxable Value (₹)"
              type="number"
              value={taxableValue || ''}
              onChange={(e) => setTaxableValue(Number(e.target.value))}
              placeholder="e.g. 100000"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="GST Rate (%)" type="number" value={gstRate || ''} onChange={(e) => setGstRate(Number(e.target.value))} />
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Supply Type</label>
                <select
                  value={supplyType}
                  onChange={(e) => setSupplyType(e.target.value as any)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold outline-none focus:border-indigo-600"
                >
                  <option value="INTRA">Intra-state (CGST+SGST)</option>
                  <option value="INTER">Inter-state (IGST)</option>
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
              <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Total GST</p>
              <div className="text-4xl font-black mt-2">{rupee(res.tax)}</div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">CGST</div>
                  <div className="text-lg font-black mt-1">{rupee(res.cgst)}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">SGST</div>
                  <div className="text-lg font-black mt-1">{rupee(res.sgst)}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <div className="text-white/70 font-black uppercase">IGST</div>
                  <div className="text-lg font-black mt-1">{rupee(res.igst)}</div>
                </div>
              </div>
            </div>
            <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-semibold">
              Note: Applicability depends on the nature of supply and RCM notifications. This is a simplified calculator.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GstRcmCalculator;

