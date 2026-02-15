
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import CommandPalette from './CommandPalette';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const normalizedRole = String(user?.role || '').toLowerCase();

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const isTypingTarget = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || Boolean(target.isContentEditable);
  };

  const initials = useMemo(() => {
    const name = (user?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  }, [user?.name]);
  
  const navItems = useMemo(() => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Tax News', path: '/news' },
      { label: 'Resources', path: '/resources' },
      { label: 'Calculators', path: '/calculators' },
    ];

    if (user) {
      items.push({ label: 'Dashboard', path: '/dashboard' });
      items.push({ label: 'Cases', path: '/cases' });
      if (normalizedRole === 'user') items.push({ label: 'Profile', path: '/profile' });
      items.push({ label: 'My Records', path: '/records' });
      items.push({ label: 'Book Expert', path: '/services' });
    }

    if (normalizedRole === 'admin') {
      items.push({ label: 'Admin Panel', path: '/admin' });
      items.push({ label: 'Users', path: '/admin/users' });
    }

    return items;
  }, [normalizedRole, user]);

  const primaryNavItems = useMemo(() => {
    if (!user) {
      return [
        { label: 'Tax News', path: '/news' },
        { label: 'Resources', path: '/resources' },
        { label: 'Calculators', path: '/calculators' },
      ];
    }

    const items = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Cases', path: '/cases' },
      { label: 'Calculators', path: '/calculators' },
    ];

    if (normalizedRole === 'admin') items.push({ label: 'Admin', path: '/admin' });
    return items;
  }, [normalizedRole, user]);

  const moreNavItems = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'Tax News', path: '/news' },
      { label: 'Resources', path: '/resources' },
    ];
  }, [user]);

  const accountMenuItems = useMemo(() => {
    if (!user) return [];
    const items: { label: string; path: string }[] = [];
    if (normalizedRole === 'user') items.push({ label: 'Profile', path: '/profile' });
    items.push({ label: 'My Records', path: '/records' });
    items.push({ label: 'Book Expert', path: '/services' });
    if (normalizedRole === 'admin') items.push({ label: 'Users', path: '/admin/users' });
    return items;
  }, [normalizedRole, user]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMoreOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMoreOpen && !isAccountMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      if (isMoreOpen && moreMenuRef.current && moreMenuRef.current.contains(target)) return;
      if (isAccountMenuOpen && accountMenuRef.current && accountMenuRef.current.contains(target)) return;

      setIsMoreOpen(false);
      setIsAccountMenuOpen(false);
    };

    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [isMoreOpen, isAccountMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname.startsWith('/dashboard');
    if (path === '/cases') return location.pathname.startsWith('/cases');
    if (path === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/legacy';
    return location.pathname === path;
  };

  return (
    <>
      <nav className="glass-effect sticky top-0 z-50 border-b border-slate-200/40 dark:border-slate-700/60 shadow-lg shadow-slate-900/5 dark:shadow-slate-900/40 relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-white/60 dark:bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-glow group-hover:shadow-glow-lg group-hover:scale-[1.08] transition-all duration-300 ring-1 ring-white/30">
              T
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Quick
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {primaryNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`group relative text-sm font-black transition-all duration-200 py-2 px-3 rounded-xl border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                  isActive(item.path) 
                    ? 'text-indigo-700 dark:text-indigo-200 bg-white/70 dark:bg-slate-800/60 border-indigo-200/70 dark:border-indigo-900/50 shadow-sm shadow-indigo-200/30 dark:shadow-indigo-900/20' 
                    : 'text-slate-600 dark:text-slate-300 bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-slate-800/50 hover:border-slate-200/70 dark:hover:border-slate-700/70 hover:text-slate-900 dark:hover:text-white'
                } hover:-translate-y-[1px] active:translate-y-0`}
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/70 to-purple-500/0 transition-opacity ${
                    isActive(item.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}
                />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/30 transition-all duration-200 transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Open menu"
              title="Menu"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/30 transition-all duration-200 transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Search"
              title="Search (Ctrl+K)"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.6-5.05a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-black">Search</span>
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500">
                Ctrl
                <span className="px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-600/70 text-slate-500 dark:text-slate-300">
                  K
                </span>
              </span>
            </button>

            <button
              onClick={() => setIsCommandOpen(true)}
              className="sm:hidden p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/30 transition-all duration-200 transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Search"
              title="Search (Ctrl+K)"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.6-5.05a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/30 transition-all duration-200 transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
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

            {moreNavItems.length > 0 && (
              <div ref={moreMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen((v) => !v);
                    setIsAccountMenuOpen(false);
                  }}
                  className={`text-sm font-black transition-all duration-200 py-2 px-3 rounded-xl border flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                    isMoreOpen
                      ? 'text-indigo-700 dark:text-indigo-200 bg-white/70 dark:bg-slate-800/60 border-indigo-200/70 dark:border-indigo-900/50 shadow-sm shadow-indigo-200/30 dark:shadow-indigo-900/20'
                      : 'text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/60 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  } hover:-translate-y-[1px] active:translate-y-0`}
                  aria-label="More menu"
                  aria-expanded={isMoreOpen}
                >
                  More
                  <svg
                    className={`w-4 h-4 transition-transform opacity-80 ${isMoreOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMoreOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 glass-effect shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/60 overflow-hidden animate-scale-in origin-top-right ring-1 ring-white/20 dark:ring-white/10">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Explore</div>
                    </div>
                    <div className="p-2 space-y-1">
                      {moreNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                            isActive(item.path)
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-900/40 dark:text-indigo-200'
                              : 'bg-transparent border-transparent text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="font-black text-sm">{item.label}</span>
                          <span className="text-xs font-black text-slate-300">›</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div ref={accountMenuRef} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen((v) => !v);
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-3 p-1 pr-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                  aria-label="Account menu"
                  aria-expanded={isAccountMenuOpen}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center shadow-glow ring-1 ring-white/25">
                    {initials}
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                      {normalizedRole === 'admin' ? 'Admin' : normalizedRole === 'employee' ? 'Employee' : 'Client'}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[160px]">
                      {user.name}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform opacity-80 ${isAccountMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 glass-effect shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/60 overflow-hidden animate-scale-in origin-top-right ring-1 ring-white/20 dark:ring-white/10">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 truncate">{user.email}</div>
                    </div>

                    <div className="p-2 space-y-1">
                      {accountMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsAccountMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                            isActive(item.path)
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-900/40 dark:text-indigo-200'
                              : 'bg-transparent border-transparent text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="font-black text-sm">{item.label}</span>
                          <span className="text-xs font-black text-slate-300">›</span>
                        </Link>
                      ))}
                    </div>

                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl text-sm font-black shadow-glow ring-1 ring-white/20 hover:shadow-glow-lg transition-all duration-200 transform hover:scale-[1.03] hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>

    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-[55] md:hidden">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onMouseDown={() => setIsMobileMenuOpen(false)}
        />
        <div
          className="absolute top-0 right-0 h-full w-[86%] max-w-sm glass-effect border-l border-slate-200/40 dark:border-slate-700/60 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/60 p-5 flex flex-col ring-1 ring-white/15 dark:ring-white/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-glow ring-1 ring-white/30">
                T
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">Quick</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menu</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-700/60 hover:shadow-lg hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/30 transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              aria-label="Close menu"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {user && (
            <div className="mt-6 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signed in</div>
              <div className="mt-1 font-black text-slate-900 dark:text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300 truncate">{user.email}</div>
            </div>
          )}

          <div className="mt-6 space-y-2 overflow-y-auto pr-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-900/40 dark:text-indigo-200'
                    : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="font-black text-sm">{item.label}</span>
                <span className="text-xs font-black text-slate-300">›</span>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCommandOpen(true);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm shadow-glow hover:shadow-glow-lg transition-all duration-200"
            >
              Search
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-black text-sm hover:bg-white/70 dark:hover:bg-slate-700/60 transition-all duration-200"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm shadow-glow ring-1 ring-white/20 hover:shadow-glow-lg transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    )}

    <CommandPalette user={user} navItems={navItems} isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};

export default Navbar;
