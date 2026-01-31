
import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
            Tax Simplified for the <br/>
            <span className="text-indigo-600">Ambitious Indian.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Professional accounting, tax filing, and advisory services built for trust and growth. Whether you're 18 or 80, we make taxes easy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/calculators" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl hover:bg-indigo-700 transition-all">
              Calculate Your Tax
            </Link>
            <Link to="/services" className="bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold shadow-md hover:border-indigo-600 transition-all">
              Our Services
            </Link>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Trust Signal */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-900 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-white">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Small Firm, Huge Ambitions.</h2>
            <p className="text-slate-400 text-lg">
              We started as a small local firm in Mumbai, and now we serve clients across the globe while keeping our Indian roots strong. Our mission is to ensure every Indian taxpayer feels empowered, not overwhelmed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
            <div className="bg-white/10 p-6 rounded-2xl text-center">
              <div className="text-4xl font-black text-indigo-400">5k+</div>
              <div className="text-sm opacity-60">Happy Clients</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl text-center">
              <div className="text-4xl font-black text-indigo-400">15+</div>
              <div className="text-sm opacity-60">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800">What We Can Do For You</h2>
          <p className="text-slate-500 mt-2">Comprehensive accounting solutions under one roof.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {SERVICES.map((s, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aged Citizen Friendly Callout */}
      <section className="bg-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <img src="https://picsum.photos/id/40/600/400" alt="Smiling elderly couple" className="rounded-3xl shadow-2xl w-full md:w-1/2"/>
          <div className="flex-1">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Senior Support</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-4 mb-6 leading-tight">Tax filing made easy for our Senior Citizens.</h2>
            <p className="text-lg text-slate-600 mb-8">
              We understand that digital tax portals can be confusing. Our specialized "Senior Care" package includes door-step document collection, simplified explanations, and a dedicated account manager who speaks your language.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 font-medium text-slate-700">
                <span className="text-green-500 text-xl">✓</span> Large-print digital reports
              </li>
              <li className="flex items-center gap-3 font-medium text-slate-700">
                <span className="text-green-500 text-xl">✓</span> Phone-call support (no complex IVR)
              </li>
              <li className="flex items-center gap-3 font-medium text-slate-700">
                <span className="text-green-500 text-xl">✓</span> Assisted data entry
              </li>
            </ul>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
              Book a Free Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
