import React from 'react';
import TaxBracketVisualizer from '../components/TaxBracketVisualizer';

const Visualizer: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <span className="inline-block px-4 py-2 bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-bold mb-4">
            📊 Interactive Tax Analysis
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4">
            Tax Bracket Visualizer
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore how different income levels interact with tax slabs. Compare new and old tax regimes with interactive charts and detailed breakdowns.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl border border-blue-200 dark:border-slate-600">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Interactive Charts</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Real-time visualization of tax amounts across different income brackets
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl border border-purple-200 dark:border-slate-600">
            <div className="text-3xl mb-2">🔄</div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Regime Comparison</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Compare new and old tax regimes side-by-side with detailed metrics
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-2xl border border-green-200 dark:border-slate-600">
            <div className="text-3xl mb-2">💡</div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Detailed Breakdown</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Get a comprehensive table of tax slabs, rates, and cumulative tax amounts
            </p>
          </div>
        </div>

        {/* Visualizer Component */}
        <div className="animate-slide-up">
          <TaxBracketVisualizer />
        </div>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">New Tax Regime (FY 24-25)</h3>
            <ul className="space-y-3 text-slate-700 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                <span>No deductions allowed (except specific investments)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                <span>Lower tax rates for most income brackets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                <span>100% tax rebate up to ₹7 lakhs taxable income</span>
              </li>
              <li className="flex gap-3">
                <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                <span>More favorable for high earners</span>
              </li>
            </ul>
          </div>
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Old Tax Regime</h3>
            <ul className="space-y-3 text-slate-700 dark:text-slate-400">
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Multiple deductions available (80C, 80D, HRA, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Higher tax rates but reduced by deductions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Tax rebate up to ₹5 lakhs taxable income</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Better for those with significant deductions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
