
import React, { useState, useEffect } from 'react';
import { Inquiry, Activity } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<'INQUIRIES' | 'LOGS'>('INQUIRIES');

  useEffect(() => {
    const savedInquiries = localStorage.getItem('tax_inquiries');
    if (savedInquiries) setInquiries(JSON.parse(savedInquiries));
    
    const savedActivities = localStorage.getItem('tax_activities');
    if (savedActivities) setActivities(JSON.parse(savedActivities));
  }, []);

  const stats = [
    { name: 'Income Tax', value: inquiries.filter(i => i.service === 'Income Tax').length },
    { name: 'GST', value: inquiries.filter(i => i.service === 'GST Compliance').length },
    { name: 'Audit', value: inquiries.filter(i => i.service === 'Tax Audit').length },
    { name: 'TDS', value: inquiries.filter(i => i.service === 'TDS Returns').length },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Admin Control Centre</h1>
          <p className="text-slate-500">Managing {inquiries.length} inquiries and tracking {activities.length} user events.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
            onClick={() => setActiveTab('INQUIRIES')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'INQUIRIES' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
           >
            Inquiries
           </button>
           <button 
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'LOGS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
           >
            User Logs
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Service Interest Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <h2 className="text-lg font-bold mb-4">Real-time Pulse</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Active Calculations</div>
              <div className="text-3xl font-black text-white">{activities.length}</div>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Pending Replies</div>
              <div className="text-3xl font-black text-white">{inquiries.filter(i => i.status === 'pending').length}</div>
            </div>
            <div className="p-4 bg-indigo-600 rounded-xl">
              <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Growth Rate</div>
              <div className="text-3xl font-black text-white">+24%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'INQUIRIES' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Linked User</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No inquiries yet.</td></tr>
                ) : (
                  inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          inquiry.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{inquiry.name}</div>
                        <div className="text-xs text-slate-500">{inquiry.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{inquiry.service}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate text-xs">{inquiry.message}</td>
                      <td className="px-6 py-4 text-xs font-mono text-indigo-600">{inquiry.userId || 'Guest'}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{new Date(inquiry.timestamp).toLocaleString()}</td>
                    </tr>
                  )).reverse()
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">No logs yet. Try using a calculator!</td></tr>
                ) : (
                  activities.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">{log.userEmail}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-900 text-white text-[10px] rounded font-black">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{log.details}</td>
                    </tr>
                  )).reverse()
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
