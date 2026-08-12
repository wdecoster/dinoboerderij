// Rijmspel: breng het ding uit de linkerrij naar het ding rechts waarop het
// rijmt, terwijl er monsters over het veld lopen die je proberen te tikken.
//
// Je kunt niet verliezen. Word je getikt, dan vliegt wat je draagt terug naar
// zijn plek en staat die monster even stil — meer niet. Elke derde verkeerde
// combinatie komt er wel een monster bij, dus het wordt vanzelf drukker.

import { maakViewport } from '../../js/core/viewport.js';
import { maakLus } from '../../js/core/loop.js';
import { maakToetsen } from '../../js/core/toetsen.js';
import { maakOpslag } from '../../js/core/storage.js';
import { laadPlaatje } from '../../js/core/plaatjes.js';
import { toonLaag, registreerServiceWorker } from '../../js/core/ui.js';
import { zetKnopIconen } from '../../js/core/knoppen.js';
import { vanWortel } from '../../js/core/pad.js';
import {
  rijmparen,
  paarStandaardAan,
  paarId,
  kiesParenZonderKruisrijm,
} from '../../js/data/rijmparen.js';
import { verdienDino } from '../../js/core/verzameling.js';
import { maakNiveau } from './veld.js';
import {
  VELD,
  SPELER,
  MONSTER,
  OBSTAKEL,
  VOORWERP,
  AANTALLEN,
  STANDAARD_AANTAL,
  STANDAARD_MONSTERS,
  FOUTEN_PER_MONSTER,
} from './config.js';

const KLEUR = {
  buiten: '#fdf6e3', // rand rond het veld, gelijk aan de paginakleur
  gras: '#eaf3e0',
  grasDonker: '#dbeacd',
  baan: '#f5f0dc',
  kaart: '#fffdf7',
  kaartRand: '#c9b58b',
  inkt: '#16324f',
  zacht: '#a9bccd',
  goed: '#27ae60',
  fout: '#eb5757',
};

const font = (maat) =>
  `800 ${maat}px ui-rounded, "Segoe UI", Ubuntu, system-ui, sans-serif`;

const TERUGVLIEGTIJD = 0.45;

// --- elementen ------------------------------------------------------------

const el = {
  doek: document.getElementById('doek'),
  pauzeknop: document.getElementById('pauzeknop'),
  aantallen: document.getElementById('aantallen'),
  monsterkeuze: document.getElementById('monsterkeuze'),
  spelen: document.getElementById('spelen'),
  geenParen: document.getElementById('geen-paren'),
  parenknop: document.getElementById('parenknop'),
  parenlijst: document.getElementById('parenlijst'),
  parenKlaar: document.getElementById('paren-klaar'),
  eindtijd: document.getElementById('eindtijd'),
  eindregel: document.getElementById('eindregel'),
  opnieuw: document.getElementById('opnieuw'),
  naarMenu: document.getElementById('naar-menu'),
  verder: document.getElementById('verder'),
  stoppen: document.getElementById('stoppen'),
};

const lagen = {
  start: document.getElementById('laag-start'),
  paren: document.getElementById('laag-paren'),
  pauze: document.getElementById('laag-pauze'),
  klaar: document.getElementById('laag-klaar'),
};

const viewport = maakViewport(el.doek);
const opslag = maakOpslag('rijm');
const toetsen = maakToetsen();

// --- plaatjes -------------------------------------------------------------

const plaatjes = new Map();

async function laadPlaatjes(codepoints) {
  await Promise.all(
    [...new Set(codepoints)].map(async (cp) => {
      if (plaatjes.has(cp)) return;
      plaatjes.set(cp, await laadPlaatje(`assets/img/${cp}.svg`));
    })
  );
}

const plaatjeVan = (cp) => plaatjes.get(cp) ?? null;

// --- spelstaat ------------------------------------------------------------

const spel = {
  aantal: opslag.lees('aantal', STANDAARD_AANTAL),
  monstersAan: opslag.lees('monsters', STANDAARD_MONSTERS),
  niveau: null,
  speler: { x: 0, y: 0, kijktLinks: false },
  draagt: null,
  monsters: [],
  afstandsveld: null,
  herbereken: 0,
  fouten: 0,
  vonken: [],
  tijd: 0,
  raaktRechts: null, // waar hij nu bij staat, voor het oplichtende kaartje
  geprobeerd: null, // dit doel is al geprobeerd; pas opnieuw na weglopen
  netNeergelegd: null, // dit heeft hij net verwisseld; niet meteen terugpakken
  stilTijd: 0,
  bezig: false,
};

function paarAan(paar) {
  return opslag.lees(`paar:${paarId(paar)}`, paarStandaardAan(paar));
}

const actieveParen = () => rijmparen.filter(paarAan);

function werkStartschermBij() {
  // Tellen op klank: twee paren die op elkaar rijmen leveren samen maar één
  // bruikbaar paar op, dus dat is de echte bovengrens.
  const klanken = new Set(actieveParen().map((p) => p.klank));
  const genoeg = klanken.size >= spel.aantal;
  el.spelen.disabled = !genoeg;
  el.geenParen.hidden = genoeg;
}

// --- niveau starten -------------------------------------------------------

function husselen(lijst) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

async function startSpel() {
  const beschikbaar = actieveParen();
  if (beschikbaar.length < spel.aantal) return;

  const gekozen = kiesParenZonderKruisrijm(husselen(beschikbaar), spel.aantal);
  if (gekozen.length < spel.aantal) return;
  await laadPlaatjes([
    ...gekozen.flatMap((p) => [p.links.cp, p.rechts.cp]),
    SPELER.cp,
    ...MONSTER.cps,
    ...OBSTAKEL.cps,
  ]);

  spel.niveau = maakNiveau(gekozen);
  spel.speler = { ...spel.niveau.spelerStart, kijktLinks: false };
  spel.draagt = null;
  spel.monsters = []; // eerst leeg: nieuweMonster kijkt hierin om dubbele te vermijden
  if (spel.monstersAan) spel.monsters.push(nieuweMonster(spel.niveau.monsterStart));
  spel.afstandsveld = null;
  spel.herbereken = 0;
  spel.fouten = 0;
  spel.vonken = [];
  spel.tijd = 0;
  spel.raaktRechts = null;
  spel.geprobeerd = null;
  spel.netNeergelegd = null;
  spel.stilTijd = 0;
  spel.bezig = true;

  toetsen.vergeetAlles();
  toonLaag(lagen, null);
  el.pauzeknop.hidden = false;
  lus.start();
}

// --- oppakken, afleveren --------------------------------------------------

function dichtbij(a, b, straal) {
  return Math.hypot(a.x - b.x, a.y - b.y) < straal;
}

function legTerug(voorwerp) {
  voorwerp.terug = { vanX: voorwerp.x, vanY: voorwerp.y, t: 0 };
  voorwerp.opgepakt = false;
  spel.draagt = null;
}

function pakOp(voorwerp) {
  if (spel.draagt) {
    // Wisselen mag; vastzitten niet. Wat hij neerlegt mag hij niet meteen weer
    // oppakken, anders wisselt hij eindeloos heen en weer als hij stilstaat.
    const oude = spel.draagt;
    legTerug(oude);
    spel.netNeergelegd = oude;
  }
  voorwerp.opgepakt = true;
  voorwerp.terug = null;
  spel.draagt = voorwerp;
}

function probeerAfleveren(doel) {
  const dragend = spel.draagt;
  if (!dragend) return;

  if (dragend.paar === doel.paar) {
    dragend.klaar = true;
    doel.klaar = true;
    spel.draagt = null;
    maakVonken(doel.x, doel.y, KLEUR.goed);
    maakVonken(dragend.x, dragend.y, KLEUR.goed);
    if (spel.niveau.links.every((v) => v.klaar)) gewonnen();
    return;
  }

  // Fout: hij houdt het ding vast en kan meteen iets anders proberen.
  doel.schud = 0.5;
  dragend.schud = 0.5;
  spel.fouten += 1;
  if (spel.fouten % FOUTEN_PER_MONSTER === 0) zetMonsterBij();
}

// Alle monsters lopen naar dezelfde speler, dus met precies hetzelfde tempo
// kruipen ze op één kluitje en zie je er nog maar één. Een beetje verschil houdt
// ze uit elkaar — en het ziet er levendiger uit.
function monsterTempo() {
  return 0.85 + Math.random() * 0.25;
}

/** Een nieuwe monster: eigen soort, eigen kleur, eigen tempo. */
function nieuweMonster(plek, extra = {}) {
  const cp = MONSTER.cps[Math.floor(Math.random() * MONSTER.cps.length)];
  // Kleuren worden zonder teruglegging gekozen. Twee tinten die dicht bij
  // elkaar liggen zien er op het veld hetzelfde uit, en dan is het verschil
  // nutteloos; er zijn meer tinten dan monsters, dus dit lukt altijd.
  const bezet = spel.monsters.map((d) => d.tint);
  const vrij = MONSTER.tinten.filter((t) => !bezet.includes(t));
  const keuze = vrij.length ? vrij : MONSTER.tinten;
  const tint = keuze[Math.floor(Math.random() * keuze.length)];
  return { ...plek, cp, tint, bevroren: 0, tempo: monsterTempo(), ...extra };
}

function zetMonsterBij() {
  if (!spel.monstersAan) return;
  if (spel.monsters.length >= MONSTER.maximum) return;
  const plek = spel.niveau.veld.versteVrijePlek(spel.speler.x, spel.speler.y, MONSTER.straal);
  spel.monsters.push(nieuweMonster(plek, { verschijnt: 0.6 }));
  maakVonken(plek.x, plek.y, KLEUR.fout);
}

function getikt(monster) {
  monster.bevroren = MONSTER.bevriesTijd;
  if (spel.draagt) {
    maakVonken(spel.speler.x, spel.speler.y, KLEUR.fout);
    legTerug(spel.draagt);
  }
}

function gewonnen() {
  spel.bezig = false;
  lus.stop();
  el.pauzeknop.hidden = true;

  const seconden = Math.round(spel.tijd);
  const beste = opslag.lees(`beste:${spel.aantal}`, null);
  const record = beste === null || seconden < beste;
  if (record) opslag.schrijf(`beste:${spel.aantal}`, seconden);

  // Alles gevonden levert een dino op, dezelfde kudde als in de andere spellen.
  const dino = verdienDino();

  el.eindtijd.textContent = `${seconden} sec`;
  el.eindregel.textContent =
    (record ? 'Je snelste tot nu toe!' : `Je snelste is ${beste} sec.`) +
    ` Je verdiende een ${dino.soort.naam}!`;
  toonLaag(lagen, 'klaar');
}

function maakVonken(x, y, kleur) {
  for (let i = 0; i < 14; i++) {
    const hoek = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const snelheid = 16 + Math.random() * 18;
    spel.vonken.push({
      x,
      y,
      vx: Math.cos(hoek) * snelheid,
      vy: Math.sin(hoek) * snelheid,
      leven: 0.6,
      kleur,
    });
  }
}

// --- stap -----------------------------------------------------------------

function stap(dt) {
  for (const vonk of spel.vonken) {
    vonk.x += vonk.vx * dt;
    vonk.y += vonk.vy * dt;
    vonk.leven -= dt;
  }
  spel.vonken = spel.vonken.filter((v) => v.leven > 0);

  if (!spel.bezig) return;
  spel.tijd += dt;
  const { veld, links, rechts } = spel.niveau;

  for (const voorwerp of [...links, ...rechts]) {
    if (voorwerp.schud > 0) voorwerp.schud -= dt;
  }

  // terugvliegende voorwerpen
  for (const voorwerp of links) {
    if (!voorwerp.terug) continue;
    voorwerp.terug.t += dt / TERUGVLIEGTIJD;
    const t = Math.min(1, voorwerp.terug.t);
    voorwerp.x = voorwerp.terug.vanX + (voorwerp.thuisX - voorwerp.terug.vanX) * t;
    voorwerp.y = voorwerp.terug.vanY + (voorwerp.thuisY - voorwerp.terug.vanY) * t;
    if (t >= 1) voorwerp.terug = null;
  }

  // lopen
  const vorigeX = spel.speler.x;
  const vorigeY = spel.speler.y;
  const richting = toetsen.richting();
  if (richting.x !== 0) spel.speler.kijktLinks = richting.x < 0;
  if (richting.x !== 0 || richting.y !== 0) {
    const nieuw = veld.loop(
      spel.speler.x,
      spel.speler.y,
      richting.x * SPELER.snelheid * dt,
      richting.y * SPELER.snelheid * dt,
      SPELER.straal
    );
    spel.speler.x = nieuw.x;
    spel.speler.y = nieuw.y;
  }

  // Stilstaan is het signaal "ik bedoel dít". Langslopen is dat niet.
  const verplaatst = Math.hypot(spel.speler.x - vorigeX, spel.speler.y - vorigeY);
  spel.stilTijd = verplaatst < 0.02 ? spel.stilTijd + dt : 0;
  const staatStil = spel.stilTijd >= VOORWERP.stilTijd;

  if (spel.draagt) {
    spel.draagt.x = spel.speler.x;
    spel.draagt.y = spel.speler.y - SPELER.maat * 0.75;
  }

  const dichtstbij = (lijst) => {
    let beste = null;
    let besteAfstand = VOORWERP.pakStraal;
    for (const v of lijst) {
      const d = Math.hypot(spel.speler.x - v.x, spel.speler.y - v.y);
      if (d < besteAfstand) {
        besteAfstand = d;
        beste = v;
      }
    }
    return beste;
  };

  // oppakken: met lege handen gaat dat vanzelf, wisselen vraagt om stilstaan
  const bijLinks = dichtstbij(
    links.filter((v) => !v.klaar && !v.terug && v !== spel.draagt)
  );
  if (bijLinks !== spel.netNeergelegd) spel.netNeergelegd = null;
  if (bijLinks && bijLinks !== spel.netNeergelegd && (!spel.draagt || staatStil)) {
    pakOp(bijLinks);
  }

  // afleveren: alleen als hij er echt bij stil is blijven staan, en daarna pas
  // weer als hij is weggelopen en terugkomt
  const doel = dichtstbij(rechts.filter((v) => !v.klaar));
  if (doel !== spel.geprobeerd) spel.geprobeerd = null;
  spel.raaktRechts = doel;
  if (doel && spel.draagt && !spel.geprobeerd && staatStil) {
    spel.geprobeerd = doel;
    probeerAfleveren(doel);
  }

  // monsters
  spel.herbereken -= dt;
  if (spel.herbereken <= 0) {
    spel.afstandsveld = veld.maakAfstandsveld(spel.speler.x, spel.speler.y, MONSTER.straal);
    spel.herbereken = MONSTER.herberekenTijd;
  }

  for (const monster of spel.monsters) {
    if (monster.verschijnt > 0) {
      monster.verschijnt -= dt;
      continue;
    }
    if (monster.bevroren > 0) {
      monster.bevroren -= dt;
      continue;
    }

    // Ze komen alleen op je af als je iets draagt. Zonder iets in je handen kun
    // je dus rustig rondkijken en nadenken; het gevaar begint pas als je op weg
    // bent. Dat maakt ook meteen zichtbaar waar het spel om draait.
    const jaagt = spel.draagt !== null;
    let richtingMonster = null;

    if (jaagt) {
      richtingMonster = spel.afstandsveld
        ? veld.stapRichting(spel.afstandsveld, monster.x, monster.y)
        : null;
      if (!richtingMonster) {
        // geen route bekend: dan maar recht op de speler af
        const dx = spel.speler.x - monster.x;
        const dy = spel.speler.y - monster.y;
        const lengte = Math.hypot(dx, dy) || 1;
        richtingMonster = { x: dx / lengte, y: dy / lengte };
      }
    } else {
      // slenteren: af en toe een nieuw plekje uitzoeken
      monster.wandelTijd = (monster.wandelTijd ?? 0) - dt;
      const bijDoel =
        !monster.doel || Math.hypot(monster.doel.x - monster.x, monster.doel.y - monster.y) < 3;
      if (bijDoel || monster.wandelTijd <= 0) {
        monster.doel = {
          x: VELD.rand + Math.random() * (VELD.breedte - VELD.rand * 2),
          y: VELD.rand + Math.random() * (VELD.hoogte - VELD.rand * 2),
        };
        monster.wandelTijd = 2 + Math.random() * 3;
      }
      const dx = monster.doel.x - monster.x;
      const dy = monster.doel.y - monster.y;
      const lengte = Math.hypot(dx, dy) || 1;
      richtingMonster = { x: dx / lengte, y: dy / lengte };
    }

    const snelheid =
      (jaagt ? MONSTER.snelheid : MONSTER.wandelSnelheid) * (monster.tempo ?? 1);
    const nieuw = veld.loop(
      monster.x,
      monster.y,
      richtingMonster.x * snelheid * dt,
      richtingMonster.y * snelheid * dt,
      MONSTER.straal
    );
    monster.x = nieuw.x;
    monster.y = nieuw.y;
    monster.kijktLinks = richtingMonster.x < 0;

    if (dichtbij(monster, spel.speler, MONSTER.straal + SPELER.straal)) getikt(monster);
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

function tekenPlaatje(ctx, img, x, y, maat, kijktLinks = false, tint = 0) {
  if (!img) return;
  ctx.save();
  ctx.translate(x, y);
  if (kijktLinks) ctx.scale(-1, 1);
  // ctx.filter kent niet elke browser; zonder is de monster gewoon groen.
  // Het beetje saturate maakt de gedraaide kleuren weer fris.
  if (tint) ctx.filter = `hue-rotate(${tint}deg) saturate(1.3)`;
  ctx.drawImage(img, -maat / 2, -maat / 2, maat, maat);
  ctx.restore();
}

/**
 * Voorwerpen staan op een kaartje, obstakels niet.
 *
 * Zonder dat verschil zijn het allebei gewoon plaatjes op gras en moet je maar
 * weten dat een cactus een muur is en een peer niet. Het kaartje zegt "dit kun
 * je pakken"; de linkerkolom heeft een dichte rand (pak mij), de rechterkolom
 * een streepjesrand (hier hoort iets in).
 */
function tekenKaartje(ctx, x, y, gestippeld, opgelicht) {
  const maat = VOORWERP.maat * 1.5;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(22, 50, 79, 0.10)';
  afgerondeRechthoek(ctx, -maat / 2, -maat / 2 + 0.8, maat, maat, 2.6);
  ctx.fill();

  ctx.fillStyle = KLEUR.kaart;
  afgerondeRechthoek(ctx, -maat / 2, -maat / 2, maat, maat, 2.6);
  ctx.fill();

  ctx.strokeStyle = opgelicht ? KLEUR.goed : KLEUR.kaartRand;
  ctx.lineWidth = opgelicht ? 1.1 : 0.7;
  ctx.setLineDash(gestippeld ? [2, 1.6] : []);
  afgerondeRechthoek(ctx, -maat / 2, -maat / 2, maat, maat, 2.6);
  ctx.stroke();
  ctx.restore();
}

function tekenVoorwerp(ctx, voorwerp, gestippeld = false) {
  if (voorwerp.klaar) return;
  const schud = voorwerp.schud > 0 ? Math.sin(voorwerp.schud * 50) * 1.5 : 0;
  const x = voorwerp.x + schud;
  // Wat hij draagt zit in zijn handen, dat hoort niet meer op een kaartje.
  if (voorwerp !== spel.draagt) {
    const bijDoel =
      gestippeld && spel.draagt !== null && voorwerp === spel.raaktRechts;
    tekenKaartje(ctx, x, voorwerp.y, gestippeld, bijDoel);
  }
  tekenPlaatje(ctx, plaatjeVan(voorwerp.woord.cp), x, voorwerp.y, VOORWERP.maat);
}

/** Obstakels staan op de grond: een schaduw eronder, geen kaartje. */
function tekenObstakel(ctx, ob) {
  ctx.save();
  ctx.fillStyle = 'rgba(22, 50, 79, 0.13)';
  ctx.beginPath();
  ctx.ellipse(ob.x, ob.y + OBSTAKEL.maat * 0.42, OBSTAKEL.maat * 0.42, OBSTAKEL.maat * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  tekenPlaatje(ctx, plaatjeVan(ob.cp), ob.x, ob.y, OBSTAKEL.maat);
}

function tekenHud(ctx) {
  const gedaan = spel.niveau.links.filter((v) => v.klaar).length;
  const totaal = spel.niveau.links.length;

  // links: hoeveel paren al goed
  for (let i = 0; i < totaal; i++) {
    ctx.beginPath();
    ctx.arc(6 + i * 5, 5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = i < gedaan ? KLEUR.goed : KLEUR.zacht;
    ctx.fill();
  }

  // rechts: hoeveel fouten tot de volgende monster
  const totVolgende = spel.fouten % FOUTEN_PER_MONSTER;
  for (let i = 0; i < FOUTEN_PER_MONSTER; i++) {
    ctx.beginPath();
    ctx.arc(VELD.breedte - 6 - i * 5, 5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = i < totVolgende ? KLEUR.fout : KLEUR.zacht;
    ctx.fill();
  }
}

/**
 * Zet het tekenstelsel op het speelveld van 150 x 100, gecentreerd en zo groot
 * mogelijk binnen het doek.
 *
 * Het veld heeft een vaste maat, het doek niet. De CSS probeert er 3:2 van te
 * maken, maar daarop vertrouwen is te fragiel: klopt die verhouding een keer
 * niet, dan valt de halve rechterkolom buiten beeld en is het spel stuk. Met
 * deze omrekening past het veld altijd, hooguit met een randje eromheen.
 */
function veldStelsel(ctx) {
  const schaal = Math.min(viewport.breedte / VELD.breedte, viewport.hoogte / VELD.hoogte);
  ctx.translate(
    (viewport.breedte - VELD.breedte * schaal) / 2,
    (viewport.hoogte - VELD.hoogte * schaal) / 2
  );
  ctx.scale(schaal, schaal);
}

function teken() {
  const { ctx } = viewport;
  ctx.fillStyle = KLEUR.buiten;
  ctx.fillRect(0, 0, viewport.breedte, viewport.hoogte);

  ctx.save();
  veldStelsel(ctx);
  tekenVeld(ctx);
  ctx.restore();
}

function tekenVeld(ctx) {
  ctx.fillStyle = KLEUR.gras;
  ctx.fillRect(0, 0, VELD.breedte, VELD.hoogte);

  if (!spel.niveau) return;

  // de twee banen waar de voorwerpen staan
  ctx.fillStyle = KLEUR.baan;
  afgerondeRechthoek(ctx, 2, 2, 14, VELD.hoogte - 4, 4);
  ctx.fill();
  afgerondeRechthoek(ctx, VELD.breedte - 16, 2, 14, VELD.hoogte - 4, 4);
  ctx.fill();

  for (const ob of spel.niveau.obstakels) tekenObstakel(ctx, ob);

  for (const voorwerp of spel.niveau.rechts) tekenVoorwerp(ctx, voorwerp, true);
  for (const voorwerp of spel.niveau.links) {
    if (voorwerp !== spel.draagt) tekenVoorwerp(ctx, voorwerp);
  }

  for (const monster of spel.monsters) {
    ctx.save();
    if (monster.verschijnt > 0) ctx.globalAlpha = 1 - monster.verschijnt / 0.6;
    else if (monster.bevroren > 0) ctx.globalAlpha = 0.45;
    // Schaduwtje eronder: een bleek spook valt op het gras anders nauwelijks op,
    // en juist het monster moet je meteen zien.
    ctx.fillStyle = 'rgba(22, 50, 79, 0.16)';
    ctx.beginPath();
    ctx.ellipse(monster.x, monster.y + MONSTER.maat * 0.42, MONSTER.maat * 0.36, MONSTER.maat * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    tekenPlaatje(ctx, plaatjeVan(monster.cp), monster.x, monster.y, MONSTER.maat, monster.kijktLinks, monster.tint);
    ctx.restore();
  }

  tekenPlaatje(
    ctx,
    plaatjeVan(SPELER.cp),
    spel.speler.x,
    spel.speler.y,
    SPELER.maat,
    spel.speler.kijktLinks
  );
  if (spel.draagt) tekenVoorwerp(ctx, spel.draagt);

  for (const vonk of spel.vonken) {
    ctx.globalAlpha = Math.max(0, vonk.leven / 0.6);
    ctx.fillStyle = vonk.kleur;
    ctx.beginPath();
    ctx.arc(vonk.x, vonk.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  tekenHud(ctx);
}

const lus = maakLus(stap, teken);

// --- schermen -------------------------------------------------------------

function bouwMonsterkeuze() {
  el.monsterkeuze.replaceChildren();
  for (const [aan, tekst] of [
    [true, 'met monsters'],
    [false, 'zonder monsters'],
  ]) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paar paar--woord';
    knop.textContent = tekst;
    knop.setAttribute('aria-pressed', String(aan === spel.monstersAan));
    knop.addEventListener('click', () => {
      spel.monstersAan = aan;
      opslag.schrijf('monsters', aan);
      bouwMonsterkeuze();
    });
    el.monsterkeuze.append(knop);
  }
}

function bouwAantallen() {
  el.aantallen.replaceChildren();
  for (const aantal of AANTALLEN) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paar';
    knop.textContent = String(aantal);
    knop.setAttribute('aria-pressed', String(aantal === spel.aantal));
    knop.addEventListener('click', () => {
      spel.aantal = aantal;
      opslag.schrijf('aantal', aantal);
      bouwAantallen();
      werkStartschermBij();
    });
    el.aantallen.append(knop);
  }
}

function bouwParenlijst() {
  el.parenlijst.replaceChildren();
  for (const paar of rijmparen) {
    const item = document.createElement('li');
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'woord rijmpaar';
    knop.setAttribute('aria-pressed', String(paarAan(paar)));

    for (const kant of [paar.links, paar.rechts]) {
      const vak = document.createElement('span');
      vak.className = 'rijmpaar__helft';
      const img = document.createElement('img');
      img.src = vanWortel(`assets/img/${kant.cp}.svg`);
      img.alt = '';
      const naam = document.createElement('span');
      naam.className = 'woord__naam';
      naam.textContent = kant.woord;
      vak.append(img, naam);
      knop.append(vak);
    }

    knop.addEventListener('click', () => {
      const nieuw = !paarAan(paar);
      opslag.schrijf(`paar:${paarId(paar)}`, nieuw);
      knop.setAttribute('aria-pressed', String(nieuw));
      werkStartschermBij();
    });
    item.append(knop);
    el.parenlijst.append(item);
  }
}

function pauzeer() {
  if (!spel.bezig) return;
  lus.stop();
  toetsen.vergeetAlles();
  el.pauzeknop.hidden = true;
  toonLaag(lagen, 'pauze');
}

function naarStart() {
  spel.bezig = false;
  lus.stop();
  el.pauzeknop.hidden = true;
  bouwAantallen();
  bouwMonsterkeuze();
  werkStartschermBij();
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
el.parenknop.addEventListener('click', () => {
  bouwParenlijst();
  toonLaag(lagen, 'paren');
});
el.parenKlaar.addEventListener('click', () => {
  werkStartschermBij();
  toonLaag(lagen, 'start');
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && spel.bezig) pauzeer();
});

// Naar een ander tabblad wisselen pauzeert, met een scherm erover — anders
// staat het spel stil zonder dat er iets te zien is waarop je kunt drukken.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauzeer();
});

viewport.opWijziging = teken;
zetKnopIconen();
registreerServiceWorker();

// Testhaak. Een veldspel is van buitenaf niet te controleren — je ziet alleen
// plaatjes op een canvas — dus met ?test in de URL komt de spelstaat naar
// buiten, zodat een script kan nakijken of oppakken, rijmen en monsters doen wat
// ze horen te doen. Zonder die parameter gebeurt er niets.
if (new URLSearchParams(location.search).has('test')) {
  window.__rijm = { spel, lus, startSpel, config: { VELD, SPELER, MONSTER, VOORWERP } };
}

bouwAantallen();
bouwMonsterkeuze();
werkStartschermBij();
await laadPlaatjes([SPELER.cp, ...MONSTER.cps, ...OBSTAKEL.cps]);
teken();
