'use client';

import { useEffect } from 'react';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

/**
 * Carga la fuente "Twemoji Country Flags" para que las banderas (Regional
 * Indicator Symbols) se vean en navegadores sin glifos nativos, como Firefox
 * en Windows. El polyfill solo inyecta la fuente si detecta que hace falta
 * (en macOS/iOS/Chrome no carga nada). La fuente está auto-alojada en
 * /public/fonts para no depender de un CDN externo.
 */
export function FlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis('Twemoji Country Flags', '/fonts/TwemojiCountryFlags.woff2');
  }, []);

  return null;
}
