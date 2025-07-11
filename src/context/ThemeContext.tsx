import React, { createContext, useContext, useState, useEffect } from 'react';

// --- FIX: Define all possible theme values ---
type Theme = 'cyan' | 'synthwave' | 'dracula' | 'nord';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void; // --- FIX: Changed from toggleTheme to setTheme for clarity
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Make sure localStorage returns a valid theme, otherwise default
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return ['cyan', 'synthwave', 'dracula', 'nord'].includes(savedTheme) ? savedTheme : 'cyan';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // --- FIX: Ensure all possible theme classes are managed ---
    root.classList.remove('theme-cyan', 'theme-synthwave', 'theme-dracula', 'theme-nord');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    // --- FIX: Pass setTheme instead of toggleTheme ---
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};