// Sorteerspel: er valt een plaatje, en het moet in de linker- of rechterbak op
// grond van de beginletter van het Nederlandse woord. Fout of te laat → het
// blokje belandt op de stapel in het midden. Raakt die stapel het plafond, dan
// is het spel afgelopen.

import { maakViewport } from '../../js/core/viewport.js';
import { maakLus } from '../../js/core/loop.js';
import { maakInvoer } from '../../js/core/input.js';
import { maakOpslag } from '../../js/core/storage.js';
import { laadWoordPlaatjes, laadPlaatje } from '../../js/core/plaatjes.js';
import { toonLaag, registreerServiceWorker } from '../../js/core/ui.js';
import { zetKnopIconen } from '../../js/core/knoppen.js';
import { vanWortel } from '../../js/core/pad.js';
import { woordenMetLetter, plaatjePad, standaardAan } from '../../js/data/woorden.js';
import { verdienDino } from '../../js/core/verzameling.js';
import { paren, STANDAARD_PAAR, moeilijkheid } from './paren.js';

// --- vaste maten van het speelveld (hoogte = 100 eenheden) ----------------

const PLAFOND = 12; // stippellijn: hier mag de stapel niet aan komen
const VLOER = 97; // onderkant van de stapel
const BAK_TOP = 80;
const BLOK = 11; // hoogte én breedte van een blokje
const START_Y = -8;
const PAUZE_NA_ANTWOORD = 0.35; // seconden rust voordat het volgende valt
const GOED_PER_DINO = 5; // na zoveel goede antwoorden verdien je een dino
const VLIEGTIJD = 0.28; // seconden om naar de bak of de stapel te vliegen
const LETTER_TIJD = 1.4; // hoelang de juiste letter na een fout blijft staan

const KLEUR = {
  papier: '#fffdf7',
  inkt: '#16324f',
  zacht: '#a9bccd',
  links: '#2f80ed',
  rechts: '#e87a1e',
  goed: '#27ae60',
};

const LETTERFONT = '800 SIZEpx ui-rounded, "Segoe UI", Ubuntu, system-ui, sans-serif';
const font = (maat) => LETTERFONT.replace('SIZE', maat);

// --- elementen ------------------------------------------------------------

const el = {
  doek: document.getElementById('doek'),
  pauzeknop: document.getElementById('pauzeknop'),
  parenlijst: document.getElementById('parenlijst'),
  spelen: document.getElementById('spelen'),
  woordenknop: document.getElementById('woordenknop'),
  woordenlijst: document.getElementById('woordenlijst'),
  woordenKlaar: document.getElementById('woorden-klaar'),
  geenWoorden: document.getElementById('geen-woorden'),
  eindscore: document.getElementById('eindscore'),
  eindregel: document.getElementById('eindregel'),
  opnieuw: document.getElementById('opnieuw'),
  naarMenu: document.getElementById('naar-menu'),
  verder: document.getElementById('verder'),
  stoppen: document.getElementById('stoppen'),
};

const lagen = {
  start: document.getElementById('laag-start'),
  woorden: document.getElementById('laag-woorden'),
  klaar: document.getElementById('laag-klaar'),
  pauze: document.getElementById('laag-pauze'),
};

const viewport = maakViewport(el.doek);
const opslag = maakOpslag('sorteer');

// --- spelstaat ------------------------------------------------------------

const spel = {
  paar: paren.find((p) => p.id === opslag.lees('paar', STANDAARD_PAAR)) ?? paren[0],
  pool: [], // [{ woord, img }]
  vallend: null,
  vliegend: null,
  stapel: [],
  vonken: [],
  score: 0,
  niveau: moeilijkheid.begin,
  goedOpRij: 0,
  wachten: 0,
  bakFlits: { links: 0, rechts: 0 },
  verdiend: [], // de dino's van deze beurt, rechtsboven in beeld
  gezien: new Map(), // hoe vaak elk woord al langskwam, om herhaling te spreiden
  bezig: false,
};

/** Welke woorden staan aan? Per woord onthouden, standaard uit de woordenbank. */
function woordAan(woord) {
  return opslag.lees(`woord:${woord.woord}`, standaardAan(woord));
}

function poolVoorPaar(paar) {
  return [...woordenMetLetter(paar.links), ...woordenMetLetter(paar.rechts)].filter(woordAan);
}

async function vulPool() {
  spel.pool = await laadWoordPlaatjes(poolVoorPaar(spel.paar), plaatjePad);
  spel.gezien = new Map(); // ander letterpaar, ander lijstje
  werkStartschermBij();
}

/** Zonder woorden aan béíde kanten valt er niets te sorteren. */
function werkStartschermBij() {
  const perLetter = (letter) => spel.pool.some((w) => w.woord.letter === letter);
  const speelbaar = perLetter(spel.paar.links) && perLetter(spel.paar.rechts);
  el.spelen.disabled = !speelbaar;
  el.geenWoorden.hidden = speelbaar;
}

// --- spelverloop ----------------------------------------------------------

/**
 * Kiest het volgende plaatje: het minst gebruikte eerst.
 *
 * Puur willekeurig trekken voelt bij dagelijks spelen veel herhaliger dan het
 * is — dezelfde boom komt drie keer voorbij terwijl de helft van de bank nog
 * niet langs is geweest. We houden per woord bij hoe vaak het al gekomen is,
 * pakken alleen uit de groep die het minst is geweest, en kiezen daarbinnen
 * willekeurig. Zo komt eerst de hele bank aan de beurt voordat er iets
 * terugkeert, zonder dat de volgorde voorspelbaar wordt.
 */
function kiesWoord() {
  if (spel.pool.length === 0) return null;

  const minste = Math.min(...spel.pool.map((w) => spel.gezien.get(w.woord.woord) ?? 0));
  let kandidaten = spel.pool.filter((w) => (spel.gezien.get(w.woord.woord) ?? 0) === minste);
  // en nooit twee keer achter elkaar hetzelfde
  if (kandidaten.length > 1) kandidaten = kandidaten.filter((w) => w !== spel.laatste);

  const keuze = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  spel.gezien.set(keuze.woord.woord, (spel.gezien.get(keuze.woord.woord) ?? 0) + 1);
  spel.laatste = keuze;
  return keuze;
}

function nieuwBlokje() {
  const gekozen = kiesWoord();
  if (!gekozen) return;
  spel.vallend = {
    ...gekozen,
    x: viewport.breedte / 2,
    y: START_Y,
  };
}

function startSpel() {
  spel.score = 0;
  spel.niveau = opslag.lees(`niveau:${spel.paar.id}`, moeilijkheid.begin);
  spel.goedOpRij = 0;
  spel.stapel = [];
  spel.verdiend = [];
  spel.vonken = [];
  spel.vliegend = null;
  spel.wachten = 0;
  spel.laatste = null;
  spel.bezig = true;
  nieuwBlokje();
  toonLaag(lagen, null);
  el.pauzeknop.hidden = false;
  lus.start();
}

function stapelTop() {
  return VLOER - spel.stapel.length * BLOK;
}

function bakMidden(kant) {
  const bakBreedte = Math.min(24, viewport.breedte * 0.3);
  return kant === 'links' ? bakBreedte / 2 + 1 : viewport.breedte - bakBreedte / 2 - 1;
}

function antwoord(kant) {
  if (!spel.bezig || !spel.vallend || spel.vliegend) return;

  const blokje = spel.vallend;
  const juist = kant === 'links' ? spel.paar.links : spel.paar.rechts;
  const goed = blokje.woord.letter === juist;

  spel.vallend = null;
  spel.vliegend = {
    ...blokje,
    vanX: blokje.x,
    vanY: blokje.y,
    naarX: goed ? bakMidden(kant) : viewport.breedte / 2,
    naarY: goed ? BAK_TOP + 6 : stapelTop() - BLOK / 2,
    t: 0,
    goed,
  };

  // Bij goed licht de bak op waar het in ging; bij fout de bak waar het in had
  // gemoeten. Samen met de letter op de stapel is dat de hele uitleg.
  spel.bakFlits[goed ? kant : kant === 'links' ? 'rechts' : 'links'] = 0.4;
}

function verwerkAankomst(item) {
  if (item.goed) {
    spel.score += 1;
    spel.goedOpRij += 1;
    maakVonken(item.naarX, item.naarY);
    // Elke vijfde goede levert een dino op: hetzelfde beest als in de andere
    // spellen, en dus dezelfde kudde.
    if (spel.score % GOED_PER_DINO === 0) {
      const dino = verdienDino();
      spel.verdiend.push({ ...dino, img: null, verschijnt: 1 });
      laadPlaatje(`assets/img/${dino.soort.cp}.svg`).then((img) => {
        const laatste = spel.verdiend.at(-1);
        if (laatste) laatste.img = img;
      });
    }
    if (spel.goedOpRij >= moeilijkheid.goedVoorOmhoog) {
      spel.goedOpRij = 0;
      spel.niveau = Math.min(moeilijkheid.max, spel.niveau + 1);
      opslag.schrijf(`niveau:${spel.paar.id}`, spel.niveau);
    }
  } else {
    fout(item);
  }
  spel.wachten = PAUZE_NA_ANTWOORD;
}

function fout(item) {
  spel.stapel.push({
    img: item.img,
    woord: item.woord,
    scheef: (Math.random() - 0.5) * 0.18,
    verschoven: (Math.random() - 0.5) * 3,
    letterTijd: LETTER_TIJD,
  });
  spel.goedOpRij = 0;
  // Zakken in plaats van straffen: het moet winbaar blijven.
  spel.niveau = Math.max(moeilijkheid.begin, spel.niveau - 1);
  opslag.schrijf(`niveau:${spel.paar.id}`, spel.niveau);

  if (stapelTop() <= PLAFOND) einde();
}

function einde() {
  spel.bezig = false;
  lus.stop();
  el.pauzeknop.hidden = true;

  const beste = opslag.lees(`beste:${spel.paar.id}`, 0);
  const record = spel.score > beste;
  if (record) opslag.schrijf(`beste:${spel.paar.id}`, spel.score);

  el.eindscore.textContent = String(spel.score);
  const dinos = spel.verdiend.length;
  const dinoregel =
    dinos === 0 ? '' : ` Je verdiende ${dinos} ${dinos === 1 ? 'dino' : "dino's"}!`;
  el.eindregel.textContent =
    (record ? 'Je beste score tot nu toe!' : `Je beste score is ${Math.max(beste, spel.score)}.`) +
    dinoregel;
  toonLaag(lagen, 'klaar');
}

function maakVonken(x, y) {
  for (let i = 0; i < 14; i++) {
    const hoek = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const snelheid = 14 + Math.random() * 16;
    spel.vonken.push({
      x,
      y,
      vx: Math.cos(hoek) * snelheid,
      vy: Math.sin(hoek) * snelheid - 8,
      leven: 0.6,
    });
  }
}

// --- stap -----------------------------------------------------------------

function stap(dt) {
  for (const kant of ['links', 'rechts']) {
    spel.bakFlits[kant] = Math.max(0, spel.bakFlits[kant] - dt);
  }
  for (const blok of spel.stapel) {
    if (blok.letterTijd > 0) blok.letterTijd -= dt;
  }
  for (const dino of spel.verdiend) {
    if (dino.verschijnt > 0) dino.verschijnt -= dt;
  }
  for (const vonk of spel.vonken) {
    vonk.x += vonk.vx * dt;
    vonk.y += vonk.vy * dt;
    vonk.vy += 90 * dt;
    vonk.leven -= dt;
  }
  spel.vonken = spel.vonken.filter((v) => v.leven > 0);

  if (spel.vliegend) {
    spel.vliegend.t += dt / VLIEGTIJD;
    if (spel.vliegend.t >= 1) {
      const item = spel.vliegend;
      spel.vliegend = null;
      verwerkAankomst(item);
    }
    return;
  }

  if (!spel.bezig) return;

  if (spel.wachten > 0) {
    spel.wachten -= dt;
    if (spel.wachten <= 0) nieuwBlokje();
    return;
  }

  if (spel.vallend) {
    spel.vallend.y += moeilijkheid.snelheid(spel.niveau) * dt;
    // De stapel groeit naar boven, dus er blijft steeds minder tijd over.
    if (spel.vallend.y + BLOK / 2 >= stapelTop()) {
      const gemist = spel.vallend;
      spel.vallend = null;
      fout(gemist);
      spel.wachten = PAUZE_NA_ANTWOORD;
    }
  }
}

// --- tekenen --------------------------------------------------------------

function afgerondeRechthoek(ctx, x, y, b, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + b, y, x + b, y + h, r);
  ctx.arcTo(x + b, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + b, y, r);
  ctx.closePath();
}

function tekenBak(ctx, kant) {
  const letter = kant === 'links' ? spel.paar.links : spel.paar.rechts;
  const kleur = kant === 'links' ? KLEUR.links : KLEUR.rechts;
  const bakBreedte = Math.min(24, viewport.breedte * 0.3);
  const x = kant === 'links' ? 1 : viewport.breedte - bakBreedte - 1;
  const flits = spel.bakFlits[kant];

  ctx.save();
  if (flits > 0) {
    ctx.translate(0, -Math.sin((flits / 0.4) * Math.PI) * 2);
  }
  ctx.fillStyle = kleur;
  ctx.globalAlpha = 0.14;
  afgerondeRechthoek(ctx, x, BAK_TOP, bakBreedte, VLOER + 2 - BAK_TOP, 3);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = kleur;
  ctx.lineWidth = 1.2;
  afgerondeRechthoek(ctx, x, BAK_TOP, bakBreedte, VLOER + 2 - BAK_TOP, 3);
  ctx.stroke();

  // De letter draagt de betekenis; de kleur is alleen versiering.
  ctx.fillStyle = kleur;
  ctx.font = font(13);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, x + bakBreedte / 2, BAK_TOP + (VLOER - BAK_TOP) / 2 + 0.5);
  ctx.restore();
}

function tekenPlafond(ctx) {
  ctx.save();
  ctx.strokeStyle = KLEUR.zacht;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(0, PLAFOND);
  ctx.lineTo(viewport.breedte, PLAFOND);
  ctx.stroke();
  ctx.restore();
}

function tekenPlaatje(ctx, img, x, y, maat) {
  ctx.drawImage(img, x - maat / 2, y - maat / 2, maat, maat);
}

function tekenLetterBadge(ctx, letter, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = letter === spel.paar.links ? KLEUR.links : KLEUR.rechts;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KLEUR.papier;
  ctx.font = font(5.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, x, y + 0.3);
  ctx.restore();
}

function teken() {
  const { ctx, breedte } = viewport;
  ctx.fillStyle = KLEUR.papier;
  ctx.fillRect(0, 0, breedte, 100);

  tekenPlafond(ctx);
  tekenBak(ctx, 'links');
  tekenBak(ctx, 'rechts');

  // stapel in het midden
  spel.stapel.forEach((blok, i) => {
    const y = VLOER - i * BLOK - BLOK / 2;
    const x = breedte / 2 + blok.verschoven;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(blok.scheef);
    ctx.globalAlpha = 0.75;
    tekenPlaatje(ctx, blok.img, 0, 0, BLOK);
    ctx.restore();
    if (blok.letterTijd > 0) {
      // Even laten zien welke letter het wél was: hij leest letters prima,
      // dus dit is het moment waarop hij iets kan leren van de fout.
      tekenLetterBadge(ctx, blok.woord.letter, x, y - BLOK / 2, Math.min(1, blok.letterTijd));
    }
  });

  if (spel.vallend) {
    tekenPlaatje(ctx, spel.vallend.img, spel.vallend.x, spel.vallend.y, BLOK * 1.15);
  }

  if (spel.vliegend) {
    const v = spel.vliegend;
    const t = 1 - (1 - v.t) * (1 - v.t); // rustig uitlopen
    const x = v.vanX + (v.naarX - v.vanX) * t;
    const y = v.vanY + (v.naarY - v.vanY) * t;
    ctx.save();
    ctx.globalAlpha = v.goed ? 1 - t * 0.5 : 1;
    tekenPlaatje(ctx, v.img, x, y, BLOK * (v.goed ? 1.15 - t * 0.4 : 1.15));
    ctx.restore();
  }

  for (const vonk of spel.vonken) {
    ctx.globalAlpha = Math.max(0, vonk.leven / 0.6);
    ctx.fillStyle = KLEUR.goed;
    ctx.beginPath();
    ctx.arc(vonk.x, vonk.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // De dino's die hij deze beurt verdiend heeft, rechtsboven. Zichtbaar bewijs
  // dat goed antwoorden iets oplevert; ze staan daarna in zijn verzameling.
  const zichtbaar = spel.verdiend.slice(-8);
  zichtbaar.forEach((dino, i) => {
    if (!dino.img) return;
    const maat = 7;
    const x = breedte - 4 - i * (maat * 0.8);
    const y = 5;
    const pop = dino.verschijnt > 0 ? 1 + Math.sin((1 - dino.verschijnt) * Math.PI) * 0.5 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pop, pop);
    if (dino.tint) ctx.filter = `hue-rotate(${dino.tint}deg) saturate(1.3)`;
    ctx.drawImage(dino.img, -maat / 2, -maat / 2, maat, maat);
    ctx.restore();
  });

  // score linksboven, klein — geen HUD vol cijfers
  ctx.fillStyle = KLEUR.zacht;
  ctx.font = font(7);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(spel.score), 2, 2.5);
}

const lus = maakLus(stap, teken);

// --- schermen -------------------------------------------------------------

function bouwParenlijst() {
  el.parenlijst.replaceChildren();
  for (const paar of paren) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paar';
    knop.setAttribute('aria-pressed', String(paar.id === spel.paar.id));
    const links = document.createElement('span');
    links.className = 'paar__links';
    links.textContent = paar.links;
    const rechts = document.createElement('span');
    rechts.className = 'paar__rechts';
    rechts.textContent = paar.rechts;
    knop.append(links, rechts);
    knop.addEventListener('click', async () => {
      spel.paar = paar;
      opslag.schrijf('paar', paar.id);
      await vulPool();
      bouwParenlijst();
    });
    el.parenlijst.append(knop);
  }
}

function bouwWoordenlijst() {
  el.woordenlijst.replaceChildren();
  const alle = [
    ...woordenMetLetter(spel.paar.links),
    ...woordenMetLetter(spel.paar.rechts),
  ];
  for (const woord of alle) {
    const item = document.createElement('li');
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'woord';
    knop.setAttribute('aria-pressed', String(woordAan(woord)));

    const img = document.createElement('img');
    img.src = vanWortel(plaatjePad(woord));
    img.alt = '';
    const naam = document.createElement('span');
    naam.className = 'woord__naam';
    naam.textContent = woord.woord;

    knop.append(img, naam);
    knop.addEventListener('click', async () => {
      const nieuw = !woordAan(woord);
      opslag.schrijf(`woord:${woord.woord}`, nieuw);
      knop.setAttribute('aria-pressed', String(nieuw));
      await vulPool();
    });
    item.append(knop);
    el.woordenlijst.append(item);
  }
}

function pauzeer() {
  if (!spel.bezig) return;
  lus.stop();
  el.pauzeknop.hidden = true;
  toonLaag(lagen, 'pauze');
}

function naarStart() {
  spel.bezig = false;
  lus.stop();
  el.pauzeknop.hidden = true;
  bouwParenlijst();
  toonLaag(lagen, 'start');
}

el.spelen.addEventListener('click', startSpel);
el.opnieuw.addEventListener('click', startSpel);
el.naarMenu.addEventListener('click', naarStart);
el.stoppen.addEventListener('click', naarStart);
el.pauzeknop.addEventListener('click', pauzeer);
el.verder.addEventListener('click', () => {
  toonLaag(lagen, null);
  el.pauzeknop.hidden = false;
  lus.start();
});
el.woordenknop.addEventListener('click', () => {
  bouwWoordenlijst();
  toonLaag(lagen, 'woorden');
});
el.woordenKlaar.addEventListener('click', () => {
  bouwParenlijst();
  toonLaag(lagen, 'start');
});

// Escape = pauze. Handig voor de ouder, onzichtbaar voor het kind.
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && spel.bezig) pauzeer();
});

// Naar een andere app of tabblad wisselen pauzeert het spel. Belangrijk dat dit
// een échte pauze is met een scherm erover: anders staat het spel bij terugkomst
// stil zonder dat er iets te zien is waarop je kunt drukken.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzeer();
});

maakInvoer(el.doek, antwoord);
viewport.opWijziging = teken; // draaien van de telefoon wist het doek
zetKnopIconen();
registreerServiceWorker();

bouwParenlijst();
await vulPool();
teken();

// Testhaak, net als bij de andere spellen: met ?test in de URL kan een script
// nakijken of de woordkeuze zich netjes over de bank verdeelt.
if (new URLSearchParams(location.search).has('test')) {
  window.__sorteer = { spel, kiesWoord, vulPool, startSpel };
}
