// Een plek waar dino's rondlopen: de boerderij, het pretpark of het zwembad.
//
// Dit is geen spel — er valt niets te winnen en niets fout te doen. Het is waar
// je ziet wat je hebt. Tik op een dino en hij zegt hoe hij heet.
//
// Alle plekken draaien op deze ene scène; wat ze onderscheidt (kleur, decor,
// water, hek) staat in js/data/plekken.js. Zo kost een vierde plek een paar
// regels data en geen nieuwe code.

import { maakViewport } from './viewport.js';
import { maakLus } from './loop.js';
import { laadPlaatje } from './plaatjes.js';
import { toonLaag, registreerServiceWorker } from './ui.js';
import { zetKnopIconen } from './knoppen.js';
import { vanWortel } from './pad.js';
import {
  dinosOpPlek,
  vulDinolijst,
  wisVerzameling,
  wisVoortgang,
  noemDino,
  naamVan,
  NAAMIDEEEN,
  tintFilter,
} from './verzameling.js';
import { SOORTEN } from '../data/dinos.js';
import { plekVan, PLEKKEN } from '../data/plekken.js';

const VELD = { breedte: 150, hoogte: 100 };

// De wei: binnen het hek, en niet in de sloot langs de rand.
const WEI = { links: 8, rechts: 142, boven: 20, onder: 92 };

const DINO_MAAT = 8;
const MAX_ZICHTBAAR = 40; // meer dan dit wordt een mierenhoop

/**
 * Zet een plek in elkaar. `plekId` bepaalt kleur, decor en naam.
 */
export async function maakPlekScene(plekId) {
const PLEK = plekVan(plekId);
const DECOR = PLEK.decor;
const VIJVER = PLEK.water;

const KLEUR = {
  buiten: '#fdf6e3',
  gras: PLEK.grond,
  grasDonker: PLEK.grondVlek,
  pad: '#efe4c9',
  hek: '#b98d5f',
  hekDonker: '#9c7146',
  water: PLEK.water?.kleur ?? '#bfe3f2',
  waterRand: PLEK.water?.rand ?? '#9ccde2',
  inkt: '#16324f',
};

const font = (maat) => `800 ${maat}px ui-rounded, "Segoe UI", Ubuntu, system-ui, sans-serif`;


const el = {
  doek: document.getElementById('doek'),
  teller: document.getElementById('teller'),
  lijstknop: document.getElementById('lijstknop'),
  plekken: document.getElementById('plekken'),
  plekkenLeeg: document.getElementById('plekken-leeg'),
  lijstKlaar: document.getElementById('lijst-klaar'),
  dinolijst: document.getElementById('dinolijst'),
  lijstregel: document.getElementById('lijstregel'),
  wisknop: document.getElementById('wisknop'),
  wisregel: document.getElementById('wisregel'),
  wisDinos: document.getElementById('wis-dinos'),
  wisAlles: document.getElementById('wis-alles'),
  wisNee: document.getElementById('wis-nee'),
  naamDino: document.getElementById('naam-dino'),
  naamInvoer: document.getElementById('naam-invoer'),
  naamIdee: document.getElementById('naam-idee'),
  naamKlaar: document.getElementById('naam-klaar'),
};

const lagen = {
  lijst: document.getElementById('laag-lijst'),
  naam: document.getElementById('laag-naam'),
  wissen: document.getElementById('laag-wissen'),
  leeg: document.getElementById('laag-leeg'),
};

const viewport = maakViewport(el.doek);
const plaatjes = new Map();
const plaatjeVan = (cp) => plaatjes.get(cp) ?? null;
const plaatjePad = (cp) => vanWortel(`assets/img/${cp}.svg`);

const kudde = [];

const willekeurig = (van, tot) => van + Math.random() * (tot - van);

async function laadPlaatjes(codepoints) {
  await Promise.all(
    [...new Set(codepoints)].map(async (cp) => {
      if (!plaatjes.has(cp)) plaatjes.set(cp, await laadPlaatje(`assets/img/${cp}.svg`));
    })
  );
}

// --- de kudde -------------------------------------------------------------

function nieuwDoel(dino) {
  dino.doelX = willekeurig(WEI.links, WEI.rechts);
  dino.doelY = willekeurig(WEI.boven, WEI.onder);
}

function bouwKudde() {
  const hier = dinosOpPlek(PLEK.id);
  kudde.length = 0;

  for (const beest of hier) {
    const soort = SOORTEN.find((s) => s.cp === beest.cp);
    if (!soort) continue;

    {
      if (kudde.length >= MAX_ZICHTBAAR) break;
      const dino = {
        id: beest.id,
        cp: beest.cp,
        tint: Number(beest.tint),
        naam: naamVan(beest),
        x: willekeurig(WEI.links, WEI.rechts),
        y: willekeurig(WEI.boven, WEI.onder),
        snelheid: willekeurig(2.5, 5.5), // eenheden per seconde: rustig aan
        wacht: willekeurig(0, 3),
        kijktLinks: false,
        wiebel: Math.random() * 10,
        naamTijd: 0,
      };
      nieuwDoel(dino);
      kudde.push(dino);
    }
  }
  return {
    totaal: hier.length,
    soorten: new Set(hier.map((d) => d.cp)).size,
    varianten: new Set(hier.map((d) => `${d.cp}|${d.tint}`)).size,
  };
}

function stap(dt) {
  for (const dino of kudde) {
    if (dino.naamTijd > 0) dino.naamTijd -= dt;

    if (dino.wacht > 0) {
      dino.wacht -= dt;
      continue;
    }

    const dx = dino.doelX - dino.x;
    const dy = dino.doelY - dino.y;
    const afstand = Math.hypot(dx, dy);

    if (afstand < 1) {
      // even grazen, dan verder
      dino.wacht = willekeurig(0.8, 4);
      nieuwDoel(dino);
      continue;
    }

    dino.x += (dx / afstand) * dino.snelheid * dt;
    dino.y += (dy / afstand) * dino.snelheid * dt;
    dino.kijktLinks = dx < 0;
    dino.wiebel += dt * 6;
  }
}

// --- tekenen --------------------------------------------------------------

function veldStelsel(ctx) {
  const schaal = Math.min(viewport.breedte / VELD.breedte, viewport.hoogte / VELD.hoogte);
  ctx.translate(
    (viewport.breedte - VELD.breedte * schaal) / 2,
    (viewport.hoogte - VELD.hoogte * schaal) / 2
  );
  ctx.scale(schaal, schaal);
  return schaal;
}

function tekenPlaatje(ctx, img, x, y, maat, kijktLinks = false, tint = 0) {
  if (!img) return;
  ctx.save();
  ctx.translate(x, y);
  if (kijktLinks) ctx.scale(-1, 1);
  if (tint) ctx.filter = `hue-rotate(${tint}deg) saturate(1.3)`;
  ctx.drawImage(img, -maat / 2, -maat / 2, maat, maat);
  ctx.restore();
}

// Het hek loopt precies langs de wei. Alle maten worden afgeleid van HEK, zodat
// er nooit een paaltje buiten het veld valt.
const HEK = { links: 4, rechts: 146, boven: 11, onder: 95 };

function tekenHek(ctx) {
  ctx.strokeStyle = KLEUR.hek;
  ctx.lineWidth = 1.2;

  // twee liggende balken rondom
  for (const inzet of [0, 2.5]) {
    ctx.strokeRect(
      HEK.links + inzet,
      HEK.boven + inzet,
      HEK.rechts - HEK.links - inzet * 2,
      HEK.onder - HEK.boven - inzet * 2
    );
  }

  // staande paaltjes op de boven- en onderrand
  ctx.fillStyle = KLEUR.hekDonker;
  for (let x = HEK.links; x <= HEK.rechts; x += 12) {
    ctx.fillRect(x - 0.9, HEK.boven - 1.5, 1.8, 7);
    ctx.fillRect(x - 0.9, HEK.onder - 5.5, 1.8, 7);
  }
  // en liggende op de zijkanten
  for (let y = HEK.boven + 6; y <= HEK.onder - 6; y += 12) {
    ctx.fillRect(HEK.links - 1.5, y - 0.9, 7, 1.8);
    ctx.fillRect(HEK.rechts - 5.5, y - 0.9, 7, 1.8);
  }
}

function tekenGrond(ctx) {
  ctx.fillStyle = KLEUR.gras;
  ctx.fillRect(0, 0, VELD.breedte, VELD.hoogte);

  // een paar donkerder plekken, puur om het minder vlak te maken
  ctx.fillStyle = KLEUR.grasDonker;
  for (const plek of [
    [70, 40, 26, 7],
    [110, 68, 20, 6],
    [40, 55, 16, 5],
    [125, 46, 12, 4],
  ]) {
    ctx.beginPath();
    ctx.ellipse(plek[0], plek[1], plek[2], plek[3], 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!VIJVER) return;
  ctx.fillStyle = KLEUR.waterRand;
  ctx.beginPath();
  ctx.ellipse(VIJVER.x, VIJVER.y, VIJVER.rx + 1, VIJVER.ry + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = KLEUR.water;
  ctx.beginPath();
  ctx.ellipse(VIJVER.x, VIJVER.y, VIJVER.rx, VIJVER.ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function teken() {
  const { ctx } = viewport;
  ctx.fillStyle = KLEUR.buiten;
  ctx.fillRect(0, 0, viewport.breedte, viewport.hoogte);

  ctx.save();
  veldStelsel(ctx);

  tekenGrond(ctx);
  if (PLEK.hek) tekenHek(ctx);
  for (const ding of DECOR) {
    tekenPlaatje(ctx, plaatjeVan(ding.cp), ding.x, ding.y, ding.maat);
  }

  // van boven naar beneden tekenen, zodat wie vooraan loopt er ook vóór staat
  for (const dino of [...kudde].sort((a, b) => a.y - b.y)) {
    const op = dino.wacht > 0 ? 0 : Math.sin(dino.wiebel) * 0.35;

    ctx.fillStyle = 'rgba(22, 50, 79, 0.13)';
    ctx.beginPath();
    ctx.ellipse(dino.x, dino.y + DINO_MAAT * 0.42, DINO_MAAT * 0.32, DINO_MAAT * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    tekenPlaatje(ctx, plaatjeVan(dino.cp), dino.x, dino.y + op, DINO_MAAT, dino.kijktLinks, dino.tint);

    if (dino.naamTijd > 0) {
      const naam = dino.naam;
      ctx.font = font(4.5);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const breedte = ctx.measureText(naam).width + 4;
      const y = dino.y - DINO_MAAT * 0.75;

      ctx.globalAlpha = Math.min(1, dino.naamTijd);
      ctx.fillStyle = KLEUR.buiten;
      ctx.beginPath();
      ctx.roundRect(dino.x - breedte / 2, y - 3.4, breedte, 6.8, 3.4);
      ctx.fill();
      ctx.fillStyle = KLEUR.inkt;
      ctx.fillText(naam, dino.x, y + 0.2);
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

const lus = maakLus(stap, teken);

// --- tikken op een dino ---------------------------------------------------

el.doek.addEventListener('pointerdown', (ev) => {
  const vak = el.doek.getBoundingClientRect();
  if (vak.width === 0) return;

  // schermpixels terugrekenen naar veldcoördinaten
  const schaal = Math.min(vak.width / VELD.breedte, vak.height / VELD.hoogte);
  const x = (ev.clientX - vak.left - (vak.width - VELD.breedte * schaal) / 2) / schaal;
  const y = (ev.clientY - vak.top - (vak.height - VELD.hoogte * schaal) / 2) / schaal;

  let dichtstbij = null;
  let besteAfstand = DINO_MAAT;
  for (const dino of kudde) {
    const d = Math.hypot(dino.x - x, dino.y - y);
    if (d < besteAfstand) {
      besteAfstand = d;
      dichtstbij = dino;
    }
  }
  if (dichtstbij) {
    for (const dino of kudde) dino.naamTijd = 0;
    dichtstbij.naamTijd = 2.2;
    dichtstbij.wacht = Math.max(dichtstbij.wacht, 0.8); // even blijven staan
  }
});

// --- schermen -------------------------------------------------------------

function toonLijst() {
  vulDinolijst(el.dinolijst, el.lijstregel, plaatjePad, PLEK.id, begintNaamgeven);
  toonLaag(lagen, 'lijst');
}

el.lijstknop.addEventListener('click', toonLijst);

// --- een dino een naam geven ---------------------------------------------

let inNaamgeving = null;

/**
 * Namen geven is het enige in de app waar je vrij mag typen. Dat kan hier
 * juist wél: aan een naam is niets fout, dus spelling doet er niet toe en er
 * valt niets te verliezen. Wie niet wil typen tikt op "verras me".
 */
function begintNaamgeven(dino) {
  inNaamgeving = dino;
  el.naamDino.src = plaatjePad(dino.cp);
  el.naamDino.style.filter = tintFilter(dino.tint);
  el.naamInvoer.value = dino.naam ?? '';
  toonLaag(lagen, 'naam');
  el.naamInvoer.focus();
  el.naamInvoer.select();
}

function bewaarNaam() {
  if (!inNaamgeving) return;
  noemDino(inNaamgeving.id, el.naamInvoer.value);
  inNaamgeving = null;

  // De kudde loopt al rond; die moet de nieuwe naam ook kennen.
  bouwKudde();
  teken();
  toonLijst();
}

el.naamIdee.addEventListener('click', () => {
  el.naamInvoer.value = NAAMIDEEEN[Math.floor(Math.random() * NAAMIDEEEN.length)];
  el.naamInvoer.focus();
});

el.naamKlaar.addEventListener('click', bewaarNaam);
el.naamInvoer.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') bewaarNaam();
});
el.lijstKlaar.addEventListener('click', () => toonLaag(lagen, null));

// Wissen kan niet ongedaan gemaakt worden, dus er zit een scherm tussen. "Nee"
// staat vooraan en is de grote knop; wissen is de stille.
el.wisknop.addEventListener('click', () => {
  const totaal = Object.values(leesVerzameling()).reduce((s, n) => s + n, 0);
  el.wisregel.textContent =
    totaal === 1 ? 'Je ene dino verdwijnt.' : `Al je ${totaal} dino's verdwijnen.`;
  toonLaag(lagen, 'wissen');
});

el.wisNee.addEventListener('click', () => toonLaag(lagen, 'lijst'));

el.wisDinos.addEventListener('click', async () => {
  wisVerzameling();
  await toonKudde();
});

// Ook de moeilijkheid terug naar het begin: na een middag testen staat de
// Woordbouwer op woorden van vijf letters met afleiders, en dan begint hij niet
// meer bij het begin.
el.wisAlles.addEventListener('click', async () => {
  wisVoortgang();
  await toonKudde();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) lus.stop();
  else if (kudde.length > 0) lus.start();
});

// --- opstarten ---------------------------------------------------------

/**
 * Zet de wei klaar met wat er nu in de verzameling zit.
 *
 * Dit draait bij het laden én na het wissen, zodat de lege wei er meteen goed
 * uitziet in plaats van pas na een herlaadbeurt.
 */
async function toonKudde() {
  const telling = bouwKudde();
  bouwPlekknoppen(await import('./verzameling.js').then((m) => m.aantalPerPlek()));

  if (telling.totaal === 0) {
    lus.stop();
    el.teller.hidden = true;
    await laadPlaatjes([...DECOR.map((d) => d.cp), ...PLEKKEN.map((p) => p.icoon)]);
    toonLaag(lagen, 'leeg');
    teken();
    return;
  }

  await laadPlaatjes([
    ...DECOR.map((d) => d.cp),
    ...PLEKKEN.map((p) => p.icoon),
    ...new Set(kudde.map((d) => d.cp)),
  ]);

  const verborgen = telling.totaal - kudde.length;
  el.teller.hidden = false;
  el.teller.textContent =
    `${telling.totaal} ${telling.totaal === 1 ? 'dino' : "dino's"} · ` +
    `${telling.soorten} ${telling.soorten === 1 ? 'soort' : 'soorten'} · ` +
    `${telling.varianten} ${telling.varianten === 1 ? 'kleur' : 'kleuren'}` +
    (verborgen > 0 ? ` — er lopen er ${kudde.length} in de wei` : '');

  toonLaag(lagen, null);
  lus.start();
  teken();
  return telling;
}

/**
 * Knoppen naar de andere plekken, met erbij hoeveel dino's daar lopen.
 *
 * Zonder dat zou je maar moeten raden waar je nieuwe dino gebleven is.
 */
function bouwPlekknoppen(telling) {
  for (const houder of [el.plekken, el.plekkenLeeg]) {
    if (!houder) continue;
    houder.replaceChildren();
    for (const plek of PLEKKEN) {
      const hier = plek.id === PLEK.id;
      const link = document.createElement('a');
      link.className = `plekknop${hier ? ' plekknop--hier' : ''}`;
      link.href = vanWortel(plek.pad);
      if (hier) link.setAttribute('aria-current', 'page');

      const img = document.createElement('img');
      img.src = plaatjePad(plek.icoon);
      img.alt = '';

      const naam = document.createElement('span');
      naam.textContent = plek.naam;

      const aantal = document.createElement('span');
      aantal.className = 'plekknop__aantal';
      aantal.textContent = telling[plek.id] ?? 0;

      link.append(img, naam, aantal);
      houder.append(link);
    }
  }
}

zetKnopIconen();
registreerServiceWorker();
viewport.opWijziging = teken;

const telling = await toonKudde();

// Testhaak, net als bij de spellen: met ?test in de URL kan een script nakijken
// of de kudde echt rondloopt. Zonder die parameter gebeurt er niets.
if (new URLSearchParams(location.search).has('test')) {
  window.__plek = { kudde, lus, telling, toonKudde, WEI, VELD, DINO_MAAT, plek: PLEK };
}
}
