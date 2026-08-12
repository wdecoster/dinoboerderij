// De boerderij: alle dino's die in de spellen verdiend zijn, lopen hier rond.
//
// Dit is geen spel — er valt niets te winnen en niets fout te doen. Het is de
// plek waar je ziet wat je hebt. Tik op een dino en hij zegt hoe hij heet.

import { maakViewport } from '../js/core/viewport.js';
import { maakLus } from '../js/core/loop.js';
import { laadPlaatje } from '../js/core/plaatjes.js';
import { toonLaag, registreerServiceWorker } from '../js/core/ui.js';
import { zetKnopIconen } from '../js/core/knoppen.js';
import { vanWortel } from '../js/core/pad.js';
import { leesVerzameling, vulDinolijst, tintFilter } from '../js/core/verzameling.js';
import { SOORTEN } from '../js/data/dinos.js';

const VELD = { breedte: 150, hoogte: 100 };

// De wei: binnen het hek, en niet in de sloot langs de rand.
const WEI = { links: 8, rechts: 142, boven: 20, onder: 92 };

const DINO_MAAT = 8;
const MAX_ZICHTBAAR = 40; // meer dan dit wordt een mierenhoop

const KLEUR = {
  buiten: '#fdf6e3',
  gras: '#e3f0d5',
  grasDonker: '#d5e8c4',
  pad: '#efe4c9',
  hek: '#b98d5f',
  hekDonker: '#9c7146',
  water: '#bfe3f2',
  waterRand: '#9ccde2',
  inkt: '#16324f',
};

const font = (maat) => `800 ${maat}px ui-rounded, "Segoe UI", Ubuntu, system-ui, sans-serif`;

// Vast decor: altijd op dezelfde plek, zodat de boerderij herkenbaar blijft.
const DECOR = [
  { cp: '1f3e1', x: 24, y: 15, maat: 20 }, // het huis
  { cp: '1f333', x: 128, y: 16, maat: 15 },
  { cp: '1f333', x: 112, y: 13, maat: 11 },
  { cp: '1f33b', x: 46, y: 24, maat: 7 },
  { cp: '1f33c', x: 54, y: 21, maat: 6 },
  { cp: '1f33c', x: 136, y: 62, maat: 6 },
  { cp: '1f344', x: 18, y: 74, maat: 6 },
  { cp: '1faa8', x: 96, y: 84, maat: 9 },
  { cp: '1f335', x: 138, y: 34, maat: 9 },
];

const VIJVER = { x: 34, y: 74, rx: 17, ry: 9 };

const el = {
  doek: document.getElementById('doek'),
  teller: document.getElementById('teller'),
  lijstknop: document.getElementById('lijstknop'),
  lijstKlaar: document.getElementById('lijst-klaar'),
  dinolijst: document.getElementById('dinolijst'),
  lijstregel: document.getElementById('lijstregel'),
};

const lagen = {
  lijst: document.getElementById('laag-lijst'),
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
  const verzameling = leesVerzameling();
  kudde.length = 0;

  for (const [sleutel, aantal] of Object.entries(verzameling)) {
    const [cp, tint] = sleutel.split('|');
    const soort = SOORTEN.find((s) => s.cp === cp);
    if (!soort) continue;

    for (let i = 0; i < aantal; i++) {
      if (kudde.length >= MAX_ZICHTBAAR) break;
      const dino = {
        cp,
        tint: Number(tint),
        naam: soort.naam,
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
    totaal: Object.values(verzameling).reduce((s, n) => s + n, 0),
    soorten: new Set(Object.keys(verzameling).map((k) => k.split('|')[0])).size,
    varianten: Object.keys(verzameling).length,
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

  // vijver
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
  tekenHek(ctx);
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

el.lijstknop.addEventListener('click', () => {
  vulDinolijst(el.dinolijst, el.lijstregel, plaatjePad);
  toonLaag(lagen, 'lijst');
});
el.lijstKlaar.addEventListener('click', () => toonLaag(lagen, null));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) lus.stop();
  else if (kudde.length > 0) lus.start();
});

// --- opstarten ------------------------------------------------------------

zetKnopIconen();
registreerServiceWorker();
viewport.opWijziging = teken;

const telling = bouwKudde();
await laadPlaatjes([...DECOR.map((d) => d.cp), ...new Set(kudde.map((d) => d.cp))]);

if (telling.totaal === 0) {
  toonLaag(lagen, 'leeg');
  el.teller.hidden = true;
} else {
  const verborgen = telling.totaal - kudde.length;
  el.teller.textContent =
    `${telling.totaal} ${telling.totaal === 1 ? 'dino' : "dino's"} · ` +
    `${telling.soorten} ${telling.soorten === 1 ? 'soort' : 'soorten'} · ` +
    `${telling.varianten} ${telling.varianten === 1 ? 'kleur' : 'kleuren'}` +
    (verborgen > 0 ? ` — er lopen er ${kudde.length} in de wei` : '');
  lus.start();
}

teken();

// Testhaak, net als bij de spellen: met ?test in de URL kan een script nakijken
// of de kudde echt rondloopt. Zonder die parameter gebeurt er niets.
if (new URLSearchParams(location.search).has('test')) {
  window.__boerderij = { kudde, lus, telling, WEI, VELD, DINO_MAAT };
}
