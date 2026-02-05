import React, { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Inquiry, SavedCalculation, User } from '../types';

interface ClientDashboardProps {
  user: User | null;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  if (!user) return <Navigate to="/login" />;

  const myCalculations = useMemo(() => {
    const all = JSON.parse(localStorage.getItem('tax_saved_calcs') || '[]') as SavedCalculation[];
    return all
      .filter((c) => c && c.userName === user.name)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [user.name]);

  const myInquiries = useMemo(() => {
    const all = JSON.parse(localStorage.getItem('tax_inquiries') || '[]') as Inquiry[];
    return all
      .filter((i) => {
        if (!i) return false;
        return i.email === user.email || i.userId === user.email || i.name === user.name;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [user.email, user.name]);

  const latestCalc = myCalculations[0];
  const latestInquiry = myInquiries[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Dashboard</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">Welcome, {user.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Your saved calculations and requests, in one place.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/calculators"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900 transition-all"
          >
            New Calculation
          </Link>
          <Link
            to="/services"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-5 py-3 rounded-xl text-sm font-bold hover:border-indigo-400 transition-all"
          >
            Book Expert
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved Calculations</p>
          <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mt-3">{myCalculations.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Latest: {latestCalc ? latestCalc.label : 'None yet'}
          </p>
          <Link to="/records" className="inline-block mt-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
            View records →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Requests / Inquiries</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-3">{myInquiries.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Latest: {latestInquiry ? `${latestInquiry.service} (${latestInquiry.status})` : 'None yet'}
          </p>
          <Link to="/services" className="inline-block mt-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
            Submit a request →
          </Link>
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Account</p>
          <p className="text-lg font-black mt-3">{user.email}</p>
          <p className="text-xs text-white/60 mt-1">Role: {user.role}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/visualizer" className="px-3 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/15">
              Visualizer
            </Link>
            <Link to="/news" className="px-3 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/15">
              Tax Flash
            </Link>
            <Link to="/resources" className="px-3 py-2 bg-white/10 rounded-xl text-xs font-bold hover:bg-white/15">
              Resources
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Calculations</h2>
            <Link to="/records" className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              See all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {myCalculations.slice(0, 5).map((c) => (
              <div key={c.id} className="p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="font-black text-slate-900 dark:text-white">{c.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {c.type} • {new Date(c.timestamp).toLocaleString()}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase">
                  Saved
                </span>
              </div>
            ))}
            {myCalculations.length === 0 && (
              <div className="p-10 text-center text-slate-400 text-sm font-bold">No saved calculations yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Requests</h2>
            <Link to="/services" className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              New request
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {myInquiries.slice(0, 4).map((i) => (
              <div key={i.id} className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-black text-slate-900 dark:text-white">{i.service}</div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                      i.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(i.timestamp).toLocaleString()}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-3 max-h-12 overflow-hidden">{i.message}</div>
              </div>
            ))}
            {myInquiries.length === 0 && (
              <div className="p-10 text-center text-slate-400 text-sm font-bold">No requests submitted yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
