import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, SavedCalculation } from '../types';
import { exportToPDF, exportToExcel } from '../services/exportService';
import toastConfig from '../services/toastService';
import { scheduleLocalDataSync } from '../services/dataSyncService';
import { loadJson } from '../services/storageService';

interface MyRecordsProps {
  user: User | null;
}

const MyRecords: React.FC<MyRecordsProps> = ({ user }) => {
  const [records, setRecords] = useState<SavedCalculation[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const isOwnedByUser = (calc: SavedCalculation, currentUser: User) => {
    const recordEmail = String(calc.userEmail || '').trim().toLowerCase();
    const currentEmail = String(currentUser.email || '').trim().toLowerCase();
    return Boolean(recordEmail) && recordEmail === currentEmail;
  };

  const getUserRecords = (currentUser: User) => {
    const saved = loadJson<SavedCalculation[]>('tax_saved_calcs', []);
    return saved.filter((calc) => calc && isOwnedByUser(calc, currentUser));
  };

  useEffect(() => {
    if (user) {
      setRecords(getUserRecords(user));
    }
  }, [user]);

  const handleDelete = (id: string) => {
    if (!user) return;
    const target = records.find((record) => record.id === id);
    if (!target || !isOwnedByUser(target, user)) {
      toastConfig.error('You can only delete your own records');
      return;
    }

    const updated = records.filter((record) => record.id !== id);
    setRecords(updated);
    const all = loadJson<SavedCalculation[]>('tax_saved_calcs', []);
    localStorage.setItem('tax_saved_calcs', JSON.stringify(all.filter((record) => record.id !== id)));
    scheduleLocalDataSync();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const handleExportPDF = (record: SavedCalculation) => {
    if (!user || !isOwnedByUser(record, user)) {
      toastConfig.error('You can only export your own records');
      return;
    }
    toastConfig.promise(exportToPDF(record), {
      loading: 'Preparing PDF report...',
      success: 'PDF report downloaded',
      error: 'PDF export failed',
    });
  };

  const handleExportExcel = (record: SavedCalculation) => {
    if (!user || !isOwnedByUser(record, user)) {
      toastConfig.error('You can only export your own records');
      return;
    }
    toastConfig.promise(exportToExcel(record), {
      loading: 'Preparing Excel report...',
      success: 'Excel report downloaded',
      error: 'Excel export failed',
    });
  };

  const compareRecords = () => {
    if (selected.length !== 2) return null;
    const first = records.find((record) => record.id === selected[0]);
    const second = records.find((record) => record.id === selected[1]);
    if (!first || !second) return null;

    const resultKeys = Array.from(new Set([...Object.keys(first.results || {}), ...Object.keys(second.results || {})]));

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Scenario Comparison Analysis</h3>
          <button onClick={() => setSelected([])} className="text-white/60 hover:text-white">
            Close X
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Metric</th>
                <th className="px-6 py-4 font-black text-indigo-600">{first.label}</th>
                <th className="px-6 py-4 font-black text-indigo-600">{second.label}</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultKeys.map((key) => {
                const value1 = (first.results as any)?.[key] || 0;
                const value2 = (second.results as any)?.[key] || 0;
                const diff = Number(value2 || 0) - Number(value1 || 0);
                return (
                  <tr key={key}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 uppercase tracking-tight">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </td>
                    <td className="px-6 py-4 font-bold">{typeof value1 === 'number' ? `₹${value1.toLocaleString()}` : String(value1)}</td>
                    <td className="px-6 py-4 font-bold">{typeof value2 === 'number' ? `₹${value2.toLocaleString()}` : String(value2)}</td>
                    <td
                      className={`px-6 py-4 font-black ${
                        diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-slate-400'
                      }`}
                    >
                      {Number.isFinite(diff) ? `${diff > 0 ? '+' : ''}₹${diff.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">My Records</h1>
          <p className="text-slate-500">Manage your saved calculations and generate professional reports.</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-700">
          Select 2 items to compare them side-by-side
        </div>
      </div>

      <div className="grid gap-6">
        {records.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold mb-4">No saved calculations yet.</p>
            <Link to="/calculators" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">
              Start Calculating
            </Link>
          </div>
        ) : (
          [...records]
            .reverse()
            .map((record) => (
              <div
                key={record.id}
                className={`bg-white p-6 rounded-3xl border-2 transition-all flex flex-col md:flex-row items-center gap-6 ${
                  selected.includes(record.id) ? 'border-indigo-600 shadow-xl' : 'border-slate-100 shadow-sm'
                }`}
              >
                <div
                  onClick={() => toggleSelect(record.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer ${
                    selected.includes(record.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  {selected.includes(record.id) ? '✓' : ''}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-slate-800">{record.label}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black uppercase text-slate-500 rounded">
                      {record.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(record.timestamp).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportPDF(record)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors"
                    title="Export PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExportExcel(record)}
                    className="p-3 bg-green-50 text-green-600 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors"
                    title="Export Excel"
                  >
                    Excel
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {compareRecords()}
    </div>
  );
};

export default MyRecords;
