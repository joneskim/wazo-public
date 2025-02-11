import React, { createContext, useContext, useState, useEffect } from 'react';

const APP_THEME_KEY = 'app-theme';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(APP_THEME_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(APP_THEME_KEY, JSON.stringify(isDark));
    // Update body class for global theme
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev: boolean) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
