'use client';

import { useEffect } from 'react';

export type KendronicsTheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kendronics.theme';

function resolvedTheme(preference: KendronicsTheme): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(preference: KendronicsTheme) {
  const theme = resolvedTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.dataset.themePreference = preference;
}

export function readTheme(): KendronicsTheme {
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function setTheme(preference: KendronicsTheme) {
  window.localStorage.setItem(STORAGE_KEY, preference);
  applyTheme(preference);
  window.dispatchEvent(new CustomEvent('kendronics:theme-change', { detail: preference }));
}

export function ThemeRuntime() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const refresh = () => applyTheme(readTheme());
    refresh();
    media.addEventListener('change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      media.removeEventListener('change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return null;
}
