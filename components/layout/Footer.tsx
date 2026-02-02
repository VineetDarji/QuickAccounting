import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-400 py-16 px-4 mt-20 border-t border-slate-700/50">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm mb-12">
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">T</div>
            <span className="text-white font-bold text-xl">Quick</span>
          </div>
          <p className="text-slate-500">Mumbai's leading tech-first accounting firm. Ambition meets accuracy.</p>
        </div>
        <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Navigation</h4>
          <ul className="space-y-2">
            <li><Link to="/news" className="hover:text-indigo-400 transition-colors duration-200">Tax Flash News</Link></li>
            <li><Link to="/records" className="hover:text-indigo-400 transition-colors duration-200">My Records</Link></li>
            <li><Link to="/resources" className="hover:text-indigo-400 transition-colors duration-200">Useful Resources</Link></li>
          </ul>
        </div>
        <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Help</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">FAQs</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Privacy</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200">Disclaimer</a></li>
          </ul>
        </div>
        <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Connect</h4>
          <p className="text-slate-500 hover:text-indigo-400 transition-colors">support@quickaccounting.com<br/>+91 22 4567 8900</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-700/50 pt-8 text-center text-[10px] uppercase tracking-widest text-slate-500">
        <p>© 2024 Quick Accounting Service. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
