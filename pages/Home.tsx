
import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../constants';
import FAQAccordion from '../components/FAQAccordion';

const Home: React.FC = () => {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-slide-down mb-6">
            <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
              ✨ Professional Tax Solutions For All Indians
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-6 animate-slide-up">
            Tax Simplified for the <br/>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-gradient-shift">Ambitious Indian.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{animationDelay: '0.1s'}}>
            Professional accounting, tax filing, and advisory services built for trust and growth. Whether you're 18 or 80, we make taxes easy.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Link to="/calculators" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-105 duration-300">
              Calculate Your Tax
            </Link>
            <Link to="/services" className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-xl text-lg font-bold shadow-md hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300">
              Our Services
            </Link>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400 rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse-soft" style={{animationDelay: '1s'}}></div>
        </div>
      </section>

      {/* Trust Signal */}
      <section className="max-w-7xl mx-auto px-4 animate-slide-up">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-white border border-slate-700/50 shadow-glow-lg">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4">Small Firm, Huge Ambitions.</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              We started as a small local firm in Mumbai, and now we serve clients across the globe while keeping our Indian roots strong. Our mission is to ensure every Indian taxpayer feels empowered, not overwhelmed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-110">
              <div className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">5k+</div>
              <div className="text-sm opacity-60">Happy Clients</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-center border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-110">
              <div className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">15+</div>
              <div className="text-sm opacity-60">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">What We Can Do For You</h2>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive accounting solutions under one roof.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {SERVICES.map((s, idx) => (
            <div key={idx} 
              className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20 hover:-translate-y-2 transition-all duration-300 animate-slide-up group"
              style={{animationDelay: `${idx * 0.1}s`}}>
              <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{s.icon}</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400">Get answers to the most common tax and financial questions</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 animate-slide-up">
          <FAQAccordion />
        </div>
      </section>

      {/* Aged Citizen Friendly Callout */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 py-20 animate-slide-up transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="rounded-3xl shadow-2xl w-full md:w-1/2 overflow-hidden border-2 border-indigo-200 dark:border-slate-600 transform hover:scale-105 transition-transform duration-300">
            <img src="https://picsum.photos/id/40/600/400" alt="Smiling elderly couple" className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1">
            <span className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border border-indigo-200">🎯 Senior Support</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-4 mb-6 leading-tight">Tax filing made easy for our Senior Citizens.</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We understand that digital tax portals can be confusing. Our specialized "Senior Care" package includes door-step document collection, simplified explanations, and a dedicated account manager who speaks your language.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="text-green-500 text-2xl">✓</span> Large-print digital reports
              </li>
              <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="text-green-500 text-2xl">✓</span> Phone-call support (no complex IVR)
              </li>
              <li className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span className="text-green-500 text-2xl">✓</span> Assisted data entry
              </li>
            </ul>
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-300 transition-all shadow-lg transform hover:scale-105 duration-300">
              Book a Free Consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
