// Kleine hulpjes voor de schermen die geen canvas zijn: start, game over en de
// woordenlijst. Die zijn bewust gewoon HTML — knoppen die groot, aanklikbaar en
// voorleesbaar zijn krijg je gratis, en getekende knoppen zijn dat nooit.

import { vanWortel } from './pad.js';

/** Toont precies één laag en verbergt de andere. `null` = alles weg. */
export function toonLaag(lagen, welke) {
  for (const [naam, el] of Object.entries(lagen)) {
    el.hidden = naam !== welke;
  }
}

/** Zet tekst zonder innerHTML, zodat woorden nooit als markup gelezen worden. */
export function zetTekst(el, tekst) {
  el.textContent = tekst;
}

/**
 * Registreert de service worker (offline spelen).
 * Alleen op http(s) — via file:// bestaat de API niet en dat is prima.
 */
export function registreerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(vanWortel('sw.js')).catch(() => {
      /* offline spelen is een extraatje, geen voorwaarde */
    });
  });
}
