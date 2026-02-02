import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { NEW_REGIME_SLABS_24_25, OLD_REGIME_SLABS_24_25 } from '../constants';
import { AgeGroup, TaxRegime } from '../types';

const TaxBracketVisualizer: React.FC = () => {
  const [income, setIncome] = useState(1000000);
  const [regime, setRegime] = useState<'NEW' | 'OLD'>('NEW');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(AgeGroup.NORMAL);

  const calculateTaxData = useMemo(() => {
    const slabs = regime === 'NEW' ? NEW_REGIME_SLABS_24_25 : OLD_REGIME_SLABS_24_25(ageGroup);
    const data = [];
    let cumulativeTax = 0;
    let previousLimit = 0;

    for (const slab of slabs) {
      const slabIncome = Math.min(Math.max(0, income - previousLimit), slab.limit - previousLimit);
      const slabTax = slabIncome * slab.rate;
      cumulativeTax += slabTax;

      data.push({
        range: previousLimit === 0 ? `0-${slab.limit.toLocaleString()}` : `${previousLimit.toLocaleString()}-${slab.limit === Infinity ? '∞' : slab.limit.toLocaleString()}`,
        tax: Math.round(slabTax),
        rate: `${(slab.rate * 100).toFixed(0)}%`,
        cumulative: Math.round(cumulativeTax),
        incomeInSlab: Math.round(slabIncome),
      });

      previousLimit = slab.limit;
      if (slab.limit === Infinity) break;
    }

    return { data, totalTax: Math.round(cumulativeTax + (cumulativeTax * 0.04)) }; // Add 4% cess
  }, [income, regime, ageGroup]);

  return (
    <div className="w-full space-y-8">
      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Annual Income (₹)
          </label>
          <input
            type="range"
            min="0"
            max="5000000"
            step="100000"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full cursor-pointer"
          />
          <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
            ₹{income.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Tax Regime
          </label>
          <div className="flex gap-3">
            {(['NEW', 'OLD'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRegime(r)}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                  regime === r
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {regime === 'OLD' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Age Group
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value={AgeGroup.NORMAL}>Normal (&lt;60)</option>
              <option value={AgeGroup.SENIOR}>Senior (60-80)</option>
              <option value={AgeGroup.SUPER_SENIOR}>Super Senior (&gt;80)</option>
            </select>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-indigo-200 dark:border-slate-600">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Gross Income</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{income.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-green-200 dark:border-slate-600">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Tax</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">₹{calculateTaxData.totalTax.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-blue-200 dark:border-slate-600">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Take Home</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">₹{(income - calculateTaxData.totalTax).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-orange-200 dark:border-slate-600">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tax %</p>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{((calculateTaxData.totalTax / income) * 100).toFixed(2)}%</p>
        </div>
      </div>

      {/* Tax Slab Breakdown */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Tax Slab Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={calculateTaxData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} tick={{ fill: 'currentColor' }} />
            <YAxis tick={{ fill: 'currentColor' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value) => `₹${(value as number).toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="tax" fill="#4f46e5" name="Tax Amount" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Tax Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Cumulative Tax</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={calculateTaxData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} tick={{ fill: 'currentColor' }} />
            <YAxis tick={{ fill: 'currentColor' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value) => `₹${(value as number).toLocaleString()}`}
            />
            <Line type="monotone" dataKey="cumulative" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 6 }} name="Cumulative Tax" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">Income Range</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">Tax Rate</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">Income in Slab</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">Tax Amount</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">Cumulative Tax</th>
              </tr>
            </thead>
            <tbody>
              {calculateTaxData.data.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{row.range}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">{row.rate}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">₹{row.incomeInSlab.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">₹{row.tax.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600 dark:text-green-400">₹{row.cumulative.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxBracketVisualizer;
