
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import TaxCalculator from './components/TaxCalculator';
import GstCalculator from './components/GstCalculator';
import CapitalGainsCalculator from './components/CapitalGainsCalculator';
import SimpleCalculator from './components/SimpleCalculator';
import AiAssistant from './components/AiAssistant';
import TaxNews from './pages/TaxNews';
import UsefulLinks from './pages/UsefulLinks';
import MyRecords from './pages/MyRecords';
import LoanCalculator from './components/LoanCalculators';
import { SipCalculator, LumpsumCalculator } from './components/InvestmentCalculators';
import { HraCalculator, TdsCalculator, NscCalculator } from './components/SpecificCalculators';
import { User, Inquiry, Activity, SavedCalculation } from './types';

const Login: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@taxambit.com') {
      onLogin({ email, name: 'Senior Admin', role: 'admin' });
    } else {
      onLogin({ email, name: email.split('@')[0], role: 'user' });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-8">Sign in to manage your tax profile.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="admin@taxambit.com for admin"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const InquiryPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', service: 'Income Tax', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInquiry: Inquiry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.email,
      ...formData,
      timestamp: Date.now(),
      status: 'pending'
    };
    const existing = JSON.parse(localStorage.getItem('tax_inquiries') || '[]');
    localStorage.setItem('tax_inquiries', JSON.stringify([...existing, newInquiry]));
    setSubmitted(true);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
        <h2 className="text-3xl font-bold mb-4 text-slate-900">Sign In to Consult</h2>
        <p className="text-slate-600 mb-8 text-lg">To provide personalized tax advice and protect your privacy, we require users to be signed in before booking a free consultation.</p>
        <Link to="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all inline-block">
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-bold mb-4">Inquiry Received!</h2>
        <p className="text-slate-600 mb-8">Thank you for reaching out. One of our experts will contact you at {user.email} within 24 business hours.</p>
        <button onClick={() => setSubmitted(false)} className="text-indigo-600 font-bold underline">Send another message</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-16">
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">Expert Tax Help is <br/><span className="text-indigo-600">Just One Message Away.</span></h2>
        <p className="text-lg text-slate-600 mb-8">
          Hi {user.name}, fill out the form and we'll analyze your needs. Your details are securely linked to your profile for faster processing.
        </p>
        <div className="space-y-6">
          <div className="flex gap-4 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl shrink-0">📍</div>
            <div>
              <h4 className="font-bold">Main Office</h4>
              <p className="text-slate-500 text-sm">Nariman Point, Mumbai, MH - 400021</p>
            </div>
          </div>
          <div className="flex gap-4 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl shrink-0">📞</div>
            <div>
              <h4 className="font-bold">Call Us</h4>
              <p className="text-slate-500 text-sm">+91 22 4567 8900</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" readOnly value={user.email} className="w-full p-3 border border-slate-200 rounded-lg outline-none bg-slate-100 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Service Required</label>
            <select value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg outline-none">
              <option>Income Tax</option>
              <option>GST Compliance</option>
              <option>TDS Returns</option>
              <option>Tax Audit</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
            <textarea rows={4} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg outline-none" placeholder="Tell us about your requirements..." />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
            Send Inquiry
          </button>
        </form>
      </div>
    </div>
  );
};

const CalculatorHub: React.FC<{ user: User | null }> = ({ user }) => {
  const [category, setCategory] = useState<'TAX' | 'INVEST' | 'LOAN'>('TAX');
  const [subTool, setSubTool] = useState<string>('IT');

  const onSave = (calc: SavedCalculation) => {
    const existing = JSON.parse(localStorage.getItem('tax_saved_calcs') || '[]');
    localStorage.setItem('tax_saved_calcs', JSON.stringify([...existing, calc]));
    alert('Calculation saved successfully to your records!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Expert Financial Calculators</h1>
        <p className="text-slate-600">Professional-grade tools built to handle complex Indian regulations with ease.</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { id: 'TAX', label: 'Tax Tools', icon: '🧾' },
            { id: 'INVEST', label: 'Investment Tools', icon: '📈' },
            { id: 'LOAN', label: 'Loan Tools', icon: '🏠' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                  setCategory(cat.id as any);
                  setSubTool(cat.id === 'TAX' ? 'IT' : cat.id === 'INVEST' ? 'SIP' : 'EMI');
              }}
              className={`px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all ${
                category === cat.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-400'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Select Tool</p>
            <div className="flex flex-col gap-2">
                {category === 'TAX' && (
                    <>
                        <button onClick={() => setSubTool('IT')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'IT' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Income Tax</button>
                        <button onClick={() => setSubTool('GST')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'GST' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>GST</button>
                        <button onClick={() => setSubTool('CAP')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'CAP' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Capital Gains</button>
                        <button onClick={() => setSubTool('HRA')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'HRA' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>HRA Exemption</button>
                        <button onClick={() => setSubTool('TDS')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'TDS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>TDS Est.</button>
                        <button onClick={() => setSubTool('NSC')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'NSC' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>NSC Maturity</button>
                    </>
                )}
                {category === 'INVEST' && (
                    <>
                        <button onClick={() => setSubTool('SIP')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'SIP' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>SIP Tool</button>
                        <button onClick={() => setSubTool('LUMP')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'LUMP' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Lumpsum Tool</button>
                    </>
                )}
                {category === 'LOAN' && (
                     <button onClick={() => setSubTool('EMI')} className={`text-left px-4 py-3 rounded-xl text-sm font-bold ${subTool === 'EMI' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>EMI (Home/Auto)</button>
                )}
            </div>
          </div>

          <div className="lg:col-span-3">
             {subTool === 'IT' && <TaxCalculator user={user} onSave={onSave} />}
             {subTool === 'GST' && <GstCalculator user={user} onSave={onSave} />}
             {subTool === 'CAP' && <CapitalGainsCalculator user={user} onSave={onSave} />}
             {subTool === 'HRA' && <HraCalculator user={user} onSave={onSave} />}
             {subTool === 'TDS' && <TdsCalculator user={user} onSave={onSave} />}
             {subTool === 'NSC' && <NscCalculator user={user} onSave={onSave} />}
             {subTool === 'SIP' && <SipCalculator user={user} onSave={onSave} />}
             {subTool === 'LUMP' && <LumpsumCalculator user={user} onSave={onSave} />}
             {subTool === 'EMI' && <LoanCalculator user={user} onSave={onSave} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tax_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('tax_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tax_user');
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 transition-colors duration-300">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<InquiryPage user={user} />} />
            <Route path="/calculators" element={<CalculatorHub user={user} />} />
            <Route path="/news" element={<TaxNews />} />
            <Route path="/resources" element={<UsefulLinks />} />
            <Route path="/records" element={<MyRecords user={user} />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-12 px-4 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">T</div>
                <span className="text-white font-bold text-xl">TaxAmbit</span>
              </div>
              <p>Mumbai's leading tech-first accounting firm. Ambition meets accuracy.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/news" className="hover:text-white">Tax Flash News</Link></li>
                <li><Link to="/records" className="hover:text-white">My Records</Link></li>
                <li><Link to="/resources" className="hover:text-white">Useful Resources</Link></li>
              </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Help</h4>
               <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
              </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Connect</h4>
               <p>support@taxambit.com<br/>+91 22 4567 8900</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-center text-[10px] uppercase tracking-widest">
            © 2024 TaxAmbit Solutions Pvt Ltd.
          </div>
        </footer>
        <AiAssistant />
      </div>
    </HashRouter>
  );
};

export default App;
