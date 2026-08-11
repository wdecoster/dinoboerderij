// Het keuzemenu. Weinig woorden, grote tegels, plaatje voorop — hij moet
// kunnen kiezen zonder te lezen.

import { spellen } from './games.js';
import { vanWortel } from './core/pad.js';
import { registreerServiceWorker, toonLaag } from './core/ui.js';
import { vulDinolijst } from './core/verzameling.js';

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

// De kudde is van alle spellen samen, dus hoort hij ook gewoon in het menu te
// staan en niet alleen ergens binnen een spel.
const lagen = { dinos: document.getElementById('laag-dinos') };
document.getElementById('dinoknop').addEventListener('click', () => {
  vulDinolijst(
    document.getElementById('dinolijst'),
    document.getElementById('dinoregel'),
    (cp) => vanWortel(`assets/img/${cp}.svg`)
  );
  toonLaag(lagen, 'dinos');
});
document.getElementById('dinos-klaar').addEventListener('click', () => toonLaag(lagen, null));

registreerServiceWorker();
