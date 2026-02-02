import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  return {
    isDark: typeof window !== 'undefined' && localStorage.getItem('theme_preference') === 'true',
    toggleTheme: () => {
      set((state) => {
        const newDark = !state.isDark;
        localStorage.setItem('theme_preference', String(newDark));
        
        // Update DOM immediately
        if (newDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return { isDark: newDark };
      });
    },
    setTheme: (isDark: boolean) => {
      localStorage.setItem('theme_preference', String(isDark));
      
      // Update DOM immediately
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      set({ isDark });
    },
  };
});
