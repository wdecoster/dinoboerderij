// Het keuzemenu. Weinig woorden, grote tegels, plaatje voorop — hij moet
// kunnen kiezen zonder te lezen.

import { spellen } from './games.js';
import { vanWortel } from './core/pad.js';
import { registreerServiceWorker } from './core/ui.js';
import { zetKnopIconen } from './core/knoppen.js';
import { PLEKKEN } from './data/plekken.js';
import { aantalPerPlek } from './core/verzameling.js';

const lijst = document.getElementById('tegels');

for (const spel of spellen) {
  const item = document.createElement('li');

  const tegel = document.createElement('a');
  tegel.className = 'tegel';
  tegel.href = vanWortel(spel.pad);

  const plaatje = document.createElement('img');
  plaatje.className = 'tegel__plaatje';
  plaatje.src = vanWortel(`assets/img/${spel.icoon}.svg`);
  plaatje.alt = '';
  plaatje.width = 72;
  plaatje.height = 72;

  const naam = document.createElement('span');
  naam.className = 'tegel__naam';
  naam.textContent = spel.naam;

  const uitleg = document.createElement('span');
  uitleg.className = 'tegel__uitleg';
  uitleg.textContent = spel.uitleg;

  tegel.append(plaatje, naam, uitleg);
  item.append(tegel);
  lijst.append(item);
}

// De plekken met hoeveel dino's er lopen: zo zie je vanuit het menu meteen waar
// er iets bij gekomen is.
const telling = aantalPerPlek();
const plekkenLijst = document.getElementById('plekken');
for (const plek of PLEKKEN) {
  const link = document.createElement('a');
  link.className = 'plekknop';
  link.href = vanWortel(plek.pad);

  const img = document.createElement('img');
  img.src = vanWortel(`assets/img/${plek.icoon}.svg`);
  img.alt = '';

  const naam = document.createElement('span');
  naam.textContent = plek.naam;

  const aantal = document.createElement('span');
  aantal.className = 'plekknop__aantal';
  aantal.textContent = telling[plek.id] ?? 0;

  link.append(img, naam, aantal);
  plekkenLijst.append(link);
}

zetKnopIconen();
registreerServiceWorker();
