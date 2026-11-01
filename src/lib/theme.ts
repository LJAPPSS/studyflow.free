export type Theme = 'light' | 'dark';
export type DesignStyle = 'playful' | 'retro';

const THEME_KEY = 'examiq-theme';
const STYLE_KEY = 'examiq-style';

export function getStoredTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredStyle(): DesignStyle {
  return localStorage.getItem(STYLE_KEY) === 'retro' ? 'retro' : 'playful';
}

export function applyStyle(style: DesignStyle): void {
  document.documentElement.dataset.style = style;
  localStorage.setItem(STYLE_KEY, style);
}

export function resetDisplayPreferences(): void {
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(STYLE_KEY);
  applyTheme('light');
  applyStyle('playful');
}
