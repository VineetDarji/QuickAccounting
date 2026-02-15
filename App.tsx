
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AiAssistant from './components/AiAssistant';
import AppRouter from './Router';
import { useUserStore } from './store/userStore';
import { useThemeStore } from './store/themeStore';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const { user, login, logout } = useUserStore();
  const { isDark, setTheme } = useThemeStore();

  useEffect(() => {
    const saved = localStorage.getItem('tax_user');
    if (saved) {
      try {
        login(JSON.parse(saved));
      } catch {
        localStorage.removeItem('tax_user');
      }
    }
  }, [login]);

  useEffect(() => {
    // Initialize theme from localStorage and apply to DOM
    const savedTheme = localStorage.getItem('theme_preference');
    const shouldBeDark = savedTheme === 'true';
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Sync any theme changes to the DOM
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <HashRouter>
      <Toaster />
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Navbar user={user} onLogout={logout} />
          <main className="flex-1">
            <AppRouter user={user} />
          </main>
          <Footer />
          <AiAssistant />
        </div>
      </ErrorBoundary>
    </HashRouter>
  );
};

export default App;
