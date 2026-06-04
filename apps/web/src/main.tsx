import React from 'react';
import ReactDOM from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import App from './App.tsx';
import './styles/globals.css';

// ── Инициализация Telegram WebApp ──────────────────────────────────────────

// Сообщаем Telegram, что приложение готово
WebApp.ready();

// Раскрываем на всю высоту (fallback для клиентов без fullscreen)
WebApp.expand();

// Запрашиваем настоящий fullscreen (Telegram ≥ 7.7 / Bot API 8.0)
if (typeof (WebApp as any).requestFullscreen === 'function') {
  (WebApp as any).requestFullscreen();
}

// Цвета под тёмную тему «Полночь»
try {
  WebApp.setHeaderColor('#0a0a16');
  WebApp.setBackgroundColor('#0a0a16');
  if (typeof (WebApp as any).setBottomBarColor === 'function') {
    (WebApp as any).setBottomBarColor('#0a0a16');
  }
} catch { /* old client */ }

// Слушаем события fullscreen
WebApp.onEvent('fullscreenChanged' as any, () => {
  document.documentElement.setAttribute(
    'data-fullscreen',
    String((WebApp as any).isFullscreen ?? false),
  );
});
WebApp.onEvent('fullscreenFailed' as any, (e: any) => {
  if (e?.error !== 'ALREADY_FULLSCREEN') {
    console.warn('[Fullscreen]', e?.error ?? 'failed');
  }
});

// ── Монтирование ────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
