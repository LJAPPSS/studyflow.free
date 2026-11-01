import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { applyStyle, applyTheme, getStoredStyle, getStoredTheme } from '@/lib/theme';
import './index.css';

applyTheme(getStoredTheme());
applyStyle(getStoredStyle());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
