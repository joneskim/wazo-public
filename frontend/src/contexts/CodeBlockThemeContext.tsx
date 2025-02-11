import React, { createContext, useContext, useState, useEffect } from 'react';

const CODE_BLOCKS_THEME_KEY = 'code-blocks-theme';

interface CodeBlockThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const CodeBlockThemeContext = createContext<CodeBlockThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
});

export const useCodeBlockTheme = () => useContext(CodeBlockThemeContext);

export const CodeBlockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(CODE_BLOCKS_THEME_KEY);
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(CODE_BLOCKS_THEME_KEY, JSON.stringify(isDark));
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev: boolean) => !prev);
  };

  return (
    <CodeBlockThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </CodeBlockThemeContext.Provider>
  );
};
