import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface EmployeeDashboardProps {
  user: User | null;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'employee') return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Dashboard</p>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-3">Coming soon</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-3">
        This area is reserved for employee tools and workflows. We’ll build it next.
      </p>
      <div className="mt-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Planned modules</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>• Client request queue</li>
          <li>• Document checklist</li>
          <li>• Task assignments</li>
          <li>• Status updates</li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

