
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Tax News', path: '/news' },
    { label: 'Resources', path: '/resources' },
    { label: 'Calculators', path: '/calculators' },
  ];

  if (user) {
    navItems.push({ label: 'My Records', path: '/records' });
    navItems.push({ label: 'Book Expert', path: '/services' });
  }

  if (user?.role === 'admin') {
    navItems.push({ label: 'Admin Panel', path: '/admin' });
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">T</div>
            <span className="text-xl font-black text-slate-800 tracking-tight">TaxAmbit</span>
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold transition-all relative ${
                  location.pathname === item.path 
                    ? 'text-indigo-600 after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' 
                    : 'text-slate-500 hover:text-indigo-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
