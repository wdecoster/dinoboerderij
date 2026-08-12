// Service worker: het spel moet offline blijven werken, ook op een telefoon in
// de auto. Strategie is cache-first — er verandert niets aan de inhoud tenzij
// ik een nieuwe versie uitrol, en dan is de snelste variant ook de juiste.
//
// Nieuwe versie uitrollen = VERSIE hieronder ophogen.

const VERSIE = 'v6';
const CACHE = `leesspel-${VERSIE}`;

// De schil: alles wat nodig is om de hub en de spellen te starten.
const SCHIL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'js/hub.js',
  'js/games.js',
  'js/data/woorden.js',
  'js/data/rijmparen.js',
  'js/data/spelwoorden.js',
  'js/data/dinos.js',
  'js/data/iconen.js',
  'js/core/pad.js',
  'js/core/ui.js',
  'js/core/loop.js',
  'js/core/input.js',
  'js/core/toetsen.js',
  'js/core/storage.js',
  'js/core/viewport.js',
  'js/core/plaatjes.js',
  'js/core/verzameling.js',
  'js/core/knoppen.js',
  'games/sorteer/',
  'games/sorteer/index.html',
  'games/sorteer/sorteer.js',
  'games/sorteer/paren.js',
  'games/rijm/',
  'games/rijm/index.html',
  'games/rijm/rijm.js',
  'games/rijm/veld.js',
  'games/rijm/config.js',
  'games/bouw/',
  'games/bouw/index.html',
  'games/bouw/bouw.js',
  'games/bouw/config.js',
  'games/bouw/parade.js',
  'boerderij/',
  'boerderij/index.html',
  'boerderij/boerderij.js',
  'assets/icon-192.png',
  'assets/icon-512.png',
];

// De plaatjes staan niet in de lijst hierboven maar in assets/manifest.json,
// dat door tools/haal-emoji.mjs wordt geschreven op het moment dat de SVG's
// worden opgehaald. Zo kan die lijst niet uit de pas lopen met wat er staat.
async function alleBestanden() {
  const paden = [...SCHIL];
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const { plaatjes } = await res.json();
      paden.push('assets/manifest.json', ...plaatjes);
    }
  } catch {
    /* zonder plaatjeslijst cachen we alleen de schil; de rest komt vanzelf */
  }
  return paden;
}

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const paden = await alleBestanden();
      // Eén ontbrekend bestand mag de hele installatie niet laten mislukken.
      await Promise.all(
        paden.map((pad) =>
          cache.add(new Request(pad, { cache: 'reload' })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    (async () => {
      const namen = await caches.keys();
      await Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (ev) => {
  const verzoek = ev.request;
  if (verzoek.method !== 'GET') return;
  if (new URL(verzoek.url).origin !== self.location.origin) return;

  ev.respondWith(
    (async () => {
      const uitCache = await caches.match(verzoek, { ignoreSearch: true });
      if (uitCache) return uitCache;

      try {
        const uitNetwerk = await fetch(verzoek);
        // Wat we onderweg tegenkomen bewaren we alsnog.
        if (uitNetwerk.ok && uitNetwerk.type === 'basic') {
          const cache = await caches.open(CACHE);
          cache.put(verzoek, uitNetwerk.clone());
        }
        return uitNetwerk;
      } catch {
        // Offline en niet in de cache: geef in elk geval de hub terug voor
        // een navigatie, zodat je nooit op een browserfout uitkomt.
        if (verzoek.mode === 'navigate') {
          const hub = await caches.match('index.html');
          if (hub) return hub;
        }
        throw new Error('offline en niet in de cache');
      }
    })()
  );
});
