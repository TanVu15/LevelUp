import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
// Self-host fonts (feat-pwa-public-ready REQ-04) — chỉ các weight đang dùng.
// Fontsource tự khai unicode-range (latin + vietnamese); woff2 vào precache SW → offline 100%.
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './index.css';

// Xin browser giữ localStorage/IndexedDB khỏi bị evict (iOS Safari ITP, storage pressure).
// Fire-and-forget — guest user mất storage là mất toàn bộ dữ liệu (feat-sync-hardening REQ-05).
try { navigator.storage?.persist?.().catch(() => {}); } catch { /* browser cũ không hỗ trợ */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
