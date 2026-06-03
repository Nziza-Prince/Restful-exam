import { useCallback, useEffect, useState } from 'react';
import { applyTheme, themeStorage } from '@/utils/storage';

export function useDarkMode() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => themeStorage.get());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: 'light' | 'dark') => {
    themeStorage.set(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' };
}
