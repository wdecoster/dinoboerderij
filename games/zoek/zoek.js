// Zoekplaat: er ligt een plaat vol dingen, en jij tikt alles aan dat met de
// gezochte letter begint.
//
// Dit is het rustige spel. Geen klok, geen monsters, geen manier om te
// verliezen — je zoekt tot je alles gevonden hebt. Er is ook geen animatielus:
// de plaat staat stil en er wordt alleen getekend als er iets verandert.
//
// De moeilijkheid zit in de afleiders, net als bij Voeren. Eerst beginnen ze met
// een duidelijk andere letter, later met een letter die op de gezochte lijkt —
// dan ligt er bij een gezochte b ook een deur en een pen, en moet je echt kijken.

import { maakOpslag } from '../../js/core/storage.js';
import { toonLaag, registreerServiceWorker } from '../../js/core/ui.js';
import { zetKnopIconen } from '../../js/core/knoppen.js';
import { vanWortel } from '../../js/core/pad.js';
import { woorden, woordenMetLetter, standaardAan } from '../../js/data/woorden.js';
import { VERWARREND } from '../../js/data/verwarrend.js';
import { verdienDino } from '../../js/core/verzameling.js';
import { vierDino } from '../../js/core/vieren.js';
import {
  RONDES_PER_DINO,
  MISSER_PAUZES,
  niveauVoor,
  VLAK,
  MIN_AFSTAND,
  LETTERS,
} from './config.js';

const el = {
  spel: document.getElementById('spel'),
  plaat: document.getElementById('plaat'),
  letter: document.getElementById('letter'),
  pips: document.getElementById('pips'),
  pauzeknop: document.getElementById('pauzeknop'),
  voortgang: document.getElementById('voortgang'),
  spelen: document.getElementById('spelen'),
  woordenknop: document.getElementById('woordenknop'),
  woordenlijst: document.getElementById('woordenlijst'),
  woordenKlaar: document.getElementById('woorden-klaar'),
  geenWoorden: document.getElementById('geen-woorden'),
};

const lagen = {
  start: document.getElementById('laag-start'),
  woorden: document.getElementById('laag-woorden'),
};

const opslag = maakOpslag('zoek');

const spel = {
  letter: null,
  teVinden: 0,
  gevonden: 0,
  missersDezeRonde: 0,
  geblokkeerd: false,
  bezig: false,
};

const plaatjePad = (cp) => vanWortel(`assets/img/${cp}.svg`);
const woordAan = (w) => opslag.lees(`woord:${w.woord}`, standaardAan(w));
const aantalRondes = () => opslag.lees('rondes', 0);
const huidigNiveau = () => niveauVoor(aantalRondes());

function husselen(lijst) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

const metLetter = (letter) => woordenMetLetter(letter).filter(woordAan);

// --- een plaat samenstellen -----------------------------------------------

/** Letters waarvoor er genoeg woorden zijn om een ronde mee te vullen. */
function bruikbareLetters(doelen) {
  return LETTERS.filter((l) => metLetter(l).length >= doelen);
}

/**
 * Verdeelt de afleiders over letters.
 *
 * Bij 'lijkterop' moet het gros beginnen met een letter die op de gezochte
 * lijkt (b → d, p): dan ligt er bij een gezochte b ook een deur en een pen, en
 * is zoeken pas gelukt als hij echt kijkt. Een enkele afleider uit de rest van
 * het alfabet houdt de plaat gevarieerd.
 *
 * Simpelweg de lijkende letters vaker in een trekzak stoppen werkte niet: de
 * rest van het alfabet is zo veel groter dat ze alsnog ondersneeuwden.
 */
function afleiderLetters(doelLetter, soort, aantal) {
  const anders = LETTERS.filter((l) => l !== doelLetter && metLetter(l).length > 0);
  const trek = (lijst, n) =>
    Array.from({ length: n }, () => lijst[Math.floor(Math.random() * lijst.length)]);

  if (soort !== 'lijkterop') return trek(anders, aantal);

  const lijkend = (VERWARREND[doelLetter] ?? []).filter((l) => metLetter(l).length > 0);
  if (lijkend.length === 0) return trek(anders, aantal);

  const uitLijkend = Math.ceil(aantal * 0.65);
  return husselen([...trek(lijkend, uitLijkend), ...trek(anders, aantal - uitLijkend)]);
}

/** Plekjes zoeken die niet op elkaar liggen. */
function verdeelPlekken(aantal) {
  const plekken = [];
  for (let poging = 0; poging < aantal * 200 && plekken.length < aantal; poging++) {
    const x = VLAK.links + Math.random() * (VLAK.rechts - VLAK.links);
    const y = VLAK.boven + Math.random() * (VLAK.onder - VLAK.boven);
    // De plaat is breder dan hoog, dus horizontaal mag het wat krapper.
    const teDichtbij = plekken.some(
      (p) => Math.hypot((p.x - x) * 0.6, p.y - y) < MIN_AFSTAND
    );
    if (!teDichtbij) plekken.push({ x, y });
  }
  return plekken;
}

function nieuweRonde() {
  const niveau = huidigNiveau();
  const letters = bruikbareLetters(niveau.doelen);
  if (letters.length === 0) return;

  spel.letter = letters[Math.floor(Math.random() * letters.length)];
  spel.missersDezeRonde = 0;
  spel.geblokkeerd = false;

  const doelen = husselen(metLetter(spel.letter)).slice(0, niveau.doelen);

  // Voor elke afleider is al bepaald met welke letter hij moet beginnen.
  const nodig = niveau.dingen - doelen.length;
  const uitLetters = afleiderLetters(spel.letter, niveau.afleiders, nodig);
  const afleiders = [];
  const gebruikt = new Set(doelen.map((d) => d.woord));

  for (const letter of uitLetters) {
    const kandidaten = metLetter(letter).filter((w) => !gebruikt.has(w.woord));
    if (kandidaten.length === 0) continue;
    const keuze = kandidaten[Math.floor(Math.random() * kandidaten.length)];
    gebruikt.add(keuze.woord);
    afleiders.push(keuze);
  }

  // Opvullen als een letter door was: de plaat moet wel vol.
  const alleAndere = woorden.filter((w) => woordAan(w) && w.letter !== spel.letter);
  for (const kandidaat of husselen(alleAndere)) {
    if (afleiders.length >= nodig) break;
    if (gebruikt.has(kandidaat.woord)) continue;
    gebruikt.add(kandidaat.woord);
    afleiders.push(kandidaat);
  }

  const alles = husselen([...doelen, ...afleiders]);
  const plekken = verdeelPlekken(alles.length);

  spel.teVinden = doelen.length;
  spel.gevonden = 0;

  el.letter.textContent = spel.letter;
  el.plaat.replaceChildren();

  alles.slice(0, plekken.length).forEach((woord, i) => {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'ding';
    knop.style.left = `${plekken[i].x}%`;
    knop.style.top = `${plekken[i].y}%`;
    // Een beetje verschil in grootte maakt er een plaat van in plaats van een rooster.
    knop.style.setProperty('--maat', `${0.85 + Math.random() * 0.4}`);

    const img = document.createElement('img');
    img.src = plaatjePad(woord.cp);
    img.alt = '';

    const naam = document.createElement('span');
    naam.className = 'ding__woord';
    naam.textContent = woord.woord;
    naam.hidden = true;

    knop.append(img, naam);
    knop.addEventListener('click', () => probeer(woord, knop));
    el.plaat.append(knop);
  });

  // Als er te weinig plek was, klopt het aantal doelen mogelijk niet meer.
  spel.teVinden = [...el.plaat.children].filter((k) =>
    doelen.some((d) => d.woord === k.querySelector('.ding__woord').textContent)
  ).length;

  werkPipsBij();
}

// --- zoeken ---------------------------------------------------------------

function probeer(woord, knop) {
  if (!spel.bezig || spel.geblokkeerd) return;
  if (knop.classList.contains('ding--gevonden')) return;

  if (woord.letter !== spel.letter) {
    misgegrepen(knop);
    return;
  }

  knop.classList.add('ding--gevonden');
  knop.disabled = true;
  spel.gevonden += 1;
  werkPipsBij();

  if (spel.gevonden >= spel.teVinden) rondeKlaar();
}

/**
 * Ernaast getikt: laat zien wát daar ligt, met de beginletter eruit gelicht.
 *
 * Bij een gezochte b en een aangetikte deur staat er "**d**eur" — dat is het
 * moment waarop hij twee beginletters naast elkaar ziet.
 */
function misgegrepen(knop) {
  spel.missersDezeRonde += 1;
  spel.geblokkeerd = true;

  const pauze = MISSER_PAUZES[Math.min(spel.missersDezeRonde - 1, MISSER_PAUZES.length - 1)];
  const naam = knop.querySelector('.ding__woord');

  knop.classList.remove('ding--mis');
  void knop.offsetWidth;
  knop.classList.add('ding--mis');
  if (naam) naam.hidden = false;

  setTimeout(() => {
    if (naam) naam.hidden = true;
    knop.classList.remove('ding--mis');
    spel.geblokkeerd = false;
  }, pauze);
}

function rondeKlaar() {
  spel.bezig = false;

  // Een ronde met een misgreep telt niet mee: hij is wel af, maar hij levert
  // geen dino op en brengt je niet naar een vollere plaat. Zo levert alles maar
  // aantikken niets op.
  const telt = spel.missersDezeRonde === 0;
  const rondes = aantalRondes() + (telt ? 1 : 0);
  if (telt) opslag.schrijf('rondes', rondes);

  const komtErEen = telt && rondes % RONDES_PER_DINO === 0;
  const gevierd = komtErEen ? vierDino(verdienDino()) : new Promise((r) => setTimeout(r, 700));

  gevierd.then(() => {
    if (!lagen.start.hidden || !lagen.woorden.hidden) return;
    spel.bezig = true;
    nieuweRonde();
  });
}

/** Stipjes: hoeveel van de gezochte dingen zijn al gevonden? */
function werkPipsBij() {
  el.pips.replaceChildren();
  for (let i = 0; i < spel.teVinden; i++) {
    const pip = document.createElement('span');
    pip.className = i < spel.gevonden ? 'eipip eipip--vol' : 'eipip';
    el.pips.append(pip);
  }
}

// --- schermen -------------------------------------------------------------

function werkStartschermBij() {
  const niveau = huidigNiveau();
  const genoeg = bruikbareLetters(niveau.doelen).length > 0;
  el.spelen.disabled = !genoeg;
  el.geenWoorden.hidden = genoeg;

  const rondes = aantalRondes();
  el.voortgang.textContent =
    (rondes === 0 ? 'Nog geen plaat af' : `${rondes} platen af`) +
    ` · ${niveau.dingen} dingen, ${niveau.doelen} te zoeken` +
    (niveau.afleiders === 'lijkterop' ? ' · met lastige afleiders' : '') +
    ` · elke ${RONDES_PER_DINO} platen komt er een dino bij`;
}

function bouwWoordenlijst() {
  el.woordenlijst.replaceChildren();
  for (const woord of woorden) {
    const item = document.createElement('li');
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'woord';
    knop.setAttribute('aria-pressed', String(woordAan(woord)));

    const img = document.createElement('img');
    img.src = plaatjePad(woord.cp);
    img.alt = '';
    const naam = document.createElement('span');
    naam.className = 'woord__naam';
    naam.textContent = woord.woord;

    knop.append(img, naam);
    knop.addEventListener('click', () => {
      const nieuw = !woordAan(woord);
      opslag.schrijf(`woord:${woord.woord}`, nieuw);
      knop.setAttribute('aria-pressed', String(nieuw));
      werkStartschermBij();
    });
    item.append(knop);
    el.woordenlijst.append(item);
  }
}

function startSpel() {
  if (bruikbareLetters(huidigNiveau().doelen).length === 0) return;
  spel.bezig = true;
  toonLaag(lagen, null);
  el.spel.hidden = false;
  el.pauzeknop.hidden = false;
  nieuweRonde();
}

function naarStart() {
  spel.bezig = false;
  el.spel.hidden = true;
  el.pauzeknop.hidden = true;
  werkStartschermBij();
  toonLaag(lagen, 'start');
}

el.spelen.addEventListener('click', startSpel);
el.pauzeknop.addEventListener('click', naarStart);
el.woordenknop.addEventListener('click', () => {
  bouwWoordenlijst();
  toonLaag(lagen, 'woorden');
});
el.woordenKlaar.addEventListener('click', () => {
  werkStartschermBij();
  toonLaag(lagen, 'start');
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') naarStart();
});

zetKnopIconen();
registreerServiceWorker();
werkStartschermBij();

// Testhaak, net als bij de andere spellen.
if (new URLSearchParams(location.search).has('test')) {
  window.__zoek = { spel, startSpel, nieuweRonde, probeer, opslag, huidigNiveau };
}
