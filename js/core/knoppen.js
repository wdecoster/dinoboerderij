// Zet de icoontjes op de knoppen.
//
// Elke knop of link met data-icoon="<codepoint>" krijgt dat plaatje ervoor. Zo
// staan de plaatjes in de HTML naast de tekst waar ze bij horen, in plaats van
// verspreid door de spellogica.
//
// Waarom überhaupt: het kind kan de tekst niet lezen. Het huisje ís de knop
// "terug naar het menu"; het woord ernaast is voor de ouder.

import { vanWortel } from './pad.js';

export function zetKnopIconen(wortel = document) {
  for (const knop of wortel.querySelectorAll('[data-icoon]')) {
    if (knop.querySelector('.knop__icoon')) continue; // niet dubbel doen

    const img = document.createElement('img');
    img.className = 'knop__icoon';
    img.src = vanWortel(`assets/img/${knop.dataset.icoon}.svg`);
    img.alt = ''; // de tekst ernaast zegt het al
    img.width = 24;
    img.height = 24;
    knop.prepend(img);
  }
}
