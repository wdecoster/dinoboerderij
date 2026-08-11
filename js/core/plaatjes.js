// Plaatjes vooraf inladen. Een blokje dat halverwege zijn val pas zichtbaar
// wordt is onspeelbaar, dus we wachten tot alles binnen is voordat het spel
// begint. Het gaat om SVG's van ~1,5 kB, dus dat is een kwestie van niets.

import { vanWortel } from './pad.js';

const cache = new Map();

export function laadPlaatje(pad) {
  if (cache.has(pad)) return cache.get(pad);

  const belofte = new Promise((klaar) => {
    const img = new Image();
    // Een ontbrekend plaatje mag het spel niet ophangen: we lossen dan op met
    // null en het spel slaat dat woord over.
    img.onload = () => klaar(img);
    img.onerror = () => klaar(null);
    img.src = vanWortel(pad);
  });

  cache.set(pad, belofte);
  return belofte;
}

/** Laadt alles en geeft alleen de woorden terug waarvan het plaatje er is. */
export async function laadWoordPlaatjes(woorden, padVan) {
  const geladen = await Promise.all(
    woorden.map(async (woord) => ({ woord, img: await laadPlaatje(padVan(woord)) }))
  );
  return geladen.filter((w) => w.img !== null);
}
