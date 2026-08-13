// Dino's voeren: er staat een woord in een denkwolkje, en op de plank liggen
// een paar dingen. Geef het goede ding en de dino eet het op.
//
// Dit is het enige spel waarin hij een woord echt moet lezen. De andere drie
// vragen om een letter of een klank; hier staat er een woord en moet hij weten
// wat het betekent.
//
// De moeilijkheid zit in de afleiders. Eerst verschillen ze in de eerste letter,
// zodat hij genoeg heeft aan wat hij al kan. Daarna beginnen ze allemaal met
// dezelfde letter, en uiteindelijk staat "boom" naast "boot" en "boek" en moet
// hij het woord tot het eind uitlezen.

import { maakOpslag } from '../../js/core/storage.js';
import { toonLaag, registreerServiceWorker } from '../../js/core/ui.js';
import { zetKnopIconen } from '../../js/core/knoppen.js';
import { vanWortel } from '../../js/core/pad.js';
import {
  spelwoorden,
  woordStandaardAan,
  woordenMetLengte,
  LENGTES,
} from '../../js/data/spelwoorden.js';
import { verdienDino, leesVerzameling, tintFilter } from '../../js/core/verzameling.js';
import { vierDino } from '../../js/core/vieren.js';
import { SOORTEN, TINTEN } from '../../js/data/dinos.js';
import {
  GOED_PER_DINO,
  MISSER_PAUZES,
  niveauVoor,
  MAX_GEHEUGEN,
  STANDAARD_LENGTE,
} from './config.js';

const el = {
  spel: document.getElementById('spel'),
  woord: document.getElementById('woord'),
  dino: document.getElementById('dino'),
  keuzes: document.getElementById('keuzes'),
  pips: document.getElementById('pips'),
  pauzeknop: document.getElementById('pauzeknop'),
  lengtes: document.getElementById('lengtes'),
  uitleg: document.getElementById('uitleg'),
  voortgang: document.getElementById('voortgang'),
  spelen: document.getElementById('spelen'),
  geenWoorden: document.getElementById('geen-woorden'),
  woordenknop: document.getElementById('woordenknop'),
  woordenlijst: document.getElementById('woordenlijst'),
  woordenKlaar: document.getElementById('woorden-klaar'),
};

const lagen = {
  start: document.getElementById('laag-start'),
  woorden: document.getElementById('laag-woorden'),
};

const opslag = maakOpslag('voeren');

const spel = {
  lengte: opslag.lees('lengte', STANDAARD_LENGTE), // 'auto' of een getal
  woord: null,
  recent: [],
  missersDezeRonde: 0, // gegokt? dan telt deze beurt niet mee, en de pauze loopt op
  geblokkeerd: false, // korte pauze na een misser
  bezig: false,
};

const plaatjePad = (cp) => vanWortel(`assets/img/${cp}.svg`);
const woordAan = (w) => opslag.lees(`woord:${w.woord}`, woordStandaardAan(w));
const aantalGoed = () => opslag.lees('goed', 0);
const huidigNiveau = () => niveauVoor(aantalGoed());

function husselen(lijst) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

/** Alle woorden die nu mee mogen doen als opdracht. */
function beschikbaar() {
  const lengtes = spel.lengte === 'auto' ? huidigNiveau().lengtes : [Number(spel.lengte)];
  return lengtes.flatMap((l) => woordenMetLengte(l).filter(woordAan));
}

/** Alles wat een afleider zou kunnen zijn: elk woord met een plaatje dat aanstaat. */
const alleAangezet = () => spelwoorden.filter(woordAan);

// --- de dino die je voert -------------------------------------------------

/** Een willekeurige dino uit zijn eigen kudde; heeft hij er nog geen, dan een gast. */
function kiesDino() {
  const sleutels = Object.keys(leesVerzameling());
  if (sleutels.length > 0) {
    const [cp, tint] = sleutels[Math.floor(Math.random() * sleutels.length)].split('|');
    return { cp, tint: Number(tint) };
  }
  return {
    cp: SOORTEN[Math.floor(Math.random() * SOORTEN.length)].cp,
    tint: TINTEN[Math.floor(Math.random() * TINTEN.length)],
  };
}

// --- afleiders kiezen -----------------------------------------------------

/** Op hoeveel plekken verschillen twee even lange woorden? */
function verschil(a, b) {
  if (a.length !== b.length) return 99;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

/**
 * Kiest de plaatjes die naast het goede komen te liggen.
 *
 * Valt er niet genoeg te kiezen, dan zakt hij netjes terug naar een makkelijker
 * soort afleider in plaats van te weinig keuzes te tonen.
 */
function kiesAfleiders(doel, aantal, soort) {
  const anderen = alleAangezet().filter((w) => w.woord !== doel.woord);

  const perSoort = {
    anders: () => anderen.filter((w) => w.woord[0] !== doel.woord[0]),
    zelfdeLetter: () => anderen.filter((w) => w.woord[0] === doel.woord[0]),
    lijkterop: () =>
      anderen
        .filter((w) => w.woord.length === doel.woord.length && w.woord[0] === doel.woord[0])
        .sort((a, b) => verschil(a.woord, doel.woord) - verschil(b.woord, doel.woord)),
  };

  // van moeilijk naar makkelijk terugvallen tot er genoeg zijn
  const volgorde =
    soort === 'lijkterop'
      ? ['lijkterop', 'zelfdeLetter', 'anders']
      : soort === 'zelfdeLetter'
        ? ['zelfdeLetter', 'anders']
        : ['anders'];

  const gekozen = [];
  for (const naam of volgorde) {
    const kandidaten = naam === 'lijkterop' ? perSoort[naam]() : husselen(perSoort[naam]());
    for (const kandidaat of kandidaten) {
      if (gekozen.length >= aantal) break;
      if (!gekozen.some((g) => g.woord === kandidaat.woord)) gekozen.push(kandidaat);
    }
    if (gekozen.length >= aantal) break;
  }

  // uiterste redmiddel: vul aan met wat dan ook
  for (const kandidaat of husselen(anderen)) {
    if (gekozen.length >= aantal) break;
    if (!gekozen.some((g) => g.woord === kandidaat.woord)) gekozen.push(kandidaat);
  }
  return gekozen.slice(0, aantal);
}

// --- een ronde ------------------------------------------------------------

function nieuweRonde() {
  const pool = beschikbaar();
  if (pool.length === 0) return;

  const geheugen = Math.min(MAX_GEHEUGEN, Math.max(1, Math.floor(pool.length / 2)));
  spel.recent = spel.recent.slice(-geheugen);
  const vers = pool.filter((w) => !spel.recent.includes(w.woord));
  const kiesUit = vers.length > 0 ? vers : pool;
  const doel = kiesUit[Math.floor(Math.random() * kiesUit.length)];

  spel.recent.push(doel.woord);
  spel.woord = doel;
  spel.missersDezeRonde = 0;
  spel.geblokkeerd = false;

  const niveau = huidigNiveau();
  const afleiders = kiesAfleiders(doel, niveau.keuzes - 1, niveau.afleiders);

  el.woord.textContent = doel.woord;

  const dino = kiesDino();
  el.dino.src = plaatjePad(dino.cp);
  el.dino.style.filter = tintFilter(dino.tint);

  el.keuzes.replaceChildren();
  for (const kandidaat of husselen([doel, ...afleiders])) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'keuze';

    const img = document.createElement('img');
    img.src = plaatjePad(kandidaat.cp);
    img.alt = '';

    // Staat er alleen als hij ernaast grijpt: dan zie je wát je gaf.
    const woord = document.createElement('span');
    woord.className = 'keuze__woord';
    woord.textContent = kandidaat.woord;
    woord.hidden = true;

    knop.append(img, woord);
    knop.addEventListener('click', () => probeer(kandidaat, knop));
    el.keuzes.append(knop);
  }

  werkPipsBij();
}

function probeer(kandidaat, knop) {
  if (!spel.bezig || spel.geblokkeerd) return;

  if (kandidaat.woord !== spel.woord.woord) {
    misgegrepen(knop);
    return;
  }

  spel.bezig = false;

  // Een beurt waarin gegokt is telt niet mee: niet voor de dino en niet voor de
  // moeilijkheid. Er gaat niets verloren — hij maakt de beurt gewoon af — maar
  // gokken levert ook niets op. En zo gokt hij zich niet omhoog naar woorden
  // die hij niet kan lezen.
  const telt = spel.missersDezeRonde === 0;
  const goed = aantalGoed() + (telt ? 1 : 0);
  if (telt) opslag.schrijf('goed', goed);

  // het hapje vliegt naar de dino
  knop.classList.add('keuze--op');
  el.dino.classList.remove('voeren__beest--hap');
  void el.dino.offsetWidth;
  el.dino.classList.add('voeren__beest--hap');
  werkPipsBij(goed);

  // Bij de vijfde: laat zien wát je verdiend hebt. De stipjes liepen vol en
  // waren daarna weer leeg, en daartussen zag je niets.
  const komtErEen = telt && goed % GOED_PER_DINO === 0;
  // De viering meldt zelf wanneer hij klaar is; op een traag toestel duurt dat
  // langer dan een vaste tijd op de klok.
  const gevierd = komtErEen ? vierDino(verdienDino()) : new Promise((r) => setTimeout(r, 800));

  gevierd.then(() => {
    if (!lagen.start.hidden || !lagen.woorden.hidden) return;
    spel.bezig = true;
    nieuweRonde();
  });
}

/**
 * Ernaast gegrepen: laat zien wát hij gaf, en houd de kaartjes even dicht.
 *
 * Het woord op het kaartje is het hele punt. "Je vroeg boom, ik gaf boot" is de
 * enige plek in dit spel waar hij twee woorden naast elkaar ziet.
 */
function misgegrepen(knop) {
  spel.missersDezeRonde += 1;
  spel.geblokkeerd = true;

  const pauze =
    MISSER_PAUZES[Math.min(spel.missersDezeRonde - 1, MISSER_PAUZES.length - 1)];

  knop.classList.remove('keuze--mis');
  void knop.offsetWidth;
  knop.classList.add('keuze--mis');

  const woord = knop.querySelector('.keuze__woord');
  if (woord) woord.hidden = false;

  el.dino.classList.remove('voeren__beest--nee');
  void el.dino.offsetWidth;
  el.dino.classList.add('voeren__beest--nee');

  setTimeout(() => {
    if (woord) woord.hidden = true;
    knop.classList.remove('keuze--mis');
    spel.geblokkeerd = false;
  }, pauze);
}

/** Stipjes: hoeveel keer goed tot de volgende dino? */
function werkPipsBij(goed = aantalGoed()) {
  const gedaan = goed % GOED_PER_DINO;
  el.pips.replaceChildren();
  for (let i = 0; i < GOED_PER_DINO; i++) {
    const pip = document.createElement('span');
    pip.className = i < gedaan ? 'eipip eipip--vol' : 'eipip';
    el.pips.append(pip);
  }
}

// --- schermen -------------------------------------------------------------

function werkStartschermBij() {
  const genoeg = beschikbaar().length > 0 && alleAangezet().length > 1;
  el.spelen.disabled = !genoeg;
  el.geenWoorden.hidden = genoeg;

  const goed = aantalGoed();
  const niveau = huidigNiveau();
  const lengtes = niveau.lengtes.join(' en ');
  const soort = {
    anders: 'de andere dingen beginnen met een andere letter',
    zelfdeLetter: 'de andere dingen beginnen met dezelfde letter',
    lijkterop: 'de andere woorden lijken sterk op het goede',
  }[niveau.afleiders];

  el.uitleg.textContent =
    spel.lengte === 'auto'
      ? `Vanzelf = het spel kiest de lengte en wordt langzaam moeilijker. Nu: woorden van ${lengtes} letters, ${niveau.keuzes} keuzes, ${soort}.`
      : `Altijd woorden van ${spel.lengte} letters, ${niveau.keuzes} keuzes.`;

  el.voortgang.textContent =
    goed === 0
      ? 'Nog niets gevoerd'
      : `${goed} keer goed · elke ${GOED_PER_DINO} keer komt er een dino bij`;
}

function bouwLengtes() {
  el.lengtes.replaceChildren();
  for (const optie of ['auto', ...LENGTES]) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paar';
    knop.textContent = optie === 'auto' ? 'vanzelf' : String(optie);
    if (optie === 'auto') {
      knop.classList.add('paar--woord');
      knop.dataset.icoon = '1fa84';
    }
    knop.setAttribute('aria-pressed', String(optie === spel.lengte));
    knop.addEventListener('click', () => {
      spel.lengte = optie;
      opslag.schrijf('lengte', optie);
      bouwLengtes();
      werkStartschermBij();
    });
    el.lengtes.append(knop);
  }
  zetKnopIconen(el.lengtes);
}

function bouwWoordenlijst() {
  el.woordenlijst.replaceChildren();
  for (const woord of spelwoorden) {
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
  if (beschikbaar().length === 0) return;
  spel.bezig = true;
  spel.woord = null;
  spel.recent = [];
  toonLaag(lagen, null);
  el.spel.hidden = false;
  el.pauzeknop.hidden = false;
  nieuweRonde();
}

function naarStart() {
  spel.bezig = false;
  el.spel.hidden = true;
  el.pauzeknop.hidden = true;
  bouwLengtes();
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
bouwLengtes();
werkStartschermBij();

// Testhaak, net als bij de andere spellen.
if (new URLSearchParams(location.search).has('test')) {
  window.__voeren = { spel, startSpel, probeer, opslag, beschikbaar, huidigNiveau, kiesAfleiders };
}
