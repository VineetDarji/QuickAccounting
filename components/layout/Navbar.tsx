
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Tax News', path: '/news' },
    { label: 'Resources', path: '/resources' },
    { label: 'Calculators', path: '/calculators' },
  ];

  if (user) {
    navItems.push({ label: 'Dashboard', path: '/dashboard' });
    navItems.push({ label: 'Cases', path: '/cases' });
    if (user.role === 'user') navItems.push({ label: 'Profile', path: '/profile' });
    navItems.push({ label: 'My Records', path: '/records' });
    navItems.push({ label: 'Book Expert', path: '/services' });
  }

  if (user?.role === 'admin') {
    navItems.push({ label: 'Admin Panel', path: '/admin' });
    navItems.push({ label: 'Users', path: '/admin/users' });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname.startsWith('/dashboard');
    if (path === '/cases') return location.pathname.startsWith('/cases');
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/legacy';
    return location.pathname === path;
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-slate-200/30 dark:border-slate-700/50 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-lg dark:shadow-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 group-hover:scale-110 transition-all duration-300">T</div>
            <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Quick</span>
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            {navItems.map((item, idx) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold transition-all relative py-2 px-1 duration-300 ${
                  isActive(item.path) 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-slide-right" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all transform hover:scale-110"
              aria-label="Toggle dark mode"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zm-4.536.464a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17 17a1 1 0 100-2h-3a1 1 0 100 2h3z" clipRule="evenodd"></path>
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter transition-colors duration-300">Verified</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all duration-200 transform hover:scale-105"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-indigo-900 transition-all duration-300 transform hover:scale-105"
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
