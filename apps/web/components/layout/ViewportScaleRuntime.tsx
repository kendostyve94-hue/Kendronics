'use client';

import { useEffect } from 'react';

const desktopViewportWidth = 1328;

export function ViewportScaleRuntime() {
  useEffect(() => {
    function applyDesktopScale() {
      const meta = ensureViewportMeta();
      const screenWidth = Math.min(
        window.screen.width || desktopViewportWidth,
        window.screen.availWidth || window.screen.width || desktopViewportWidth,
      );
      const scale = Math.max(0.25, Math.min(1, screenWidth / desktopViewportWidth));

      meta.setAttribute('content', `width=${desktopViewportWidth}, initial-scale=${scale.toFixed(3)}`);
    }

    applyDesktopScale();
    window.addEventListener('orientationchange', applyDesktopScale);
    window.addEventListener('resize', applyDesktopScale);

    return () => {
      window.removeEventListener('orientationchange', applyDesktopScale);
      window.removeEventListener('resize', applyDesktopScale);
    };
  }, []);

  return null;
}

function ensureViewportMeta() {
  const existing = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (existing) return existing;

  const meta = document.createElement('meta');
  meta.name = 'viewport';
  document.head.appendChild(meta);
  return meta;
}
