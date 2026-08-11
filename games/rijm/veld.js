// Het speelveld: waar staan de bergen, waar staan de voorwerpen, waar mag je
// lopen, en hoe vindt een monster de weg naar de speler.
//
// Twee dingen leven hier naast elkaar:
//  - de wereld in vloeiende coördinaten (150 x 100 eenheden), waarin gelopen
//    en gebotst wordt;
//  - een grof raster van cellen van 5 eenheden, alleen om routes en
//    bereikbaarheid uit te rekenen.

import { VELD, OBSTAKEL, MONSTER, VOORWERP } from './config.js';

const CEL = 5;
const KOLOMMEN = VELD.breedte / CEL; // 30
const RIJEN = VELD.hoogte / CEL; // 20

const celMidden = (cx, cy) => ({ x: cx * CEL + CEL / 2, y: cy * CEL + CEL / 2 });
const celVan = (x, y) => ({
  cx: Math.min(KOLOMMEN - 1, Math.max(0, Math.floor(x / CEL))),
  cy: Math.min(RIJEN - 1, Math.max(0, Math.floor(y / CEL))),
});

const willekeurig = (van, tot) => van + Math.random() * (tot - van);
const kies = (lijst) => lijst[Math.floor(Math.random() * lijst.length)];

function husselen(lijst) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

// --- botsen ---------------------------------------------------------------

/** Staat een cirkel op (x,y) met deze straal ergens waar hij niet mag staan? */
function raaktObstakel(obstakels, x, y, straal) {
  const half = OBSTAKEL.maat / 2;
  for (const ob of obstakels) {
    // dichtstbijzijnde punt op het vierkant, en dan gewoon de afstand
    const dx = Math.abs(x - ob.x) - half;
    const dy = Math.abs(y - ob.y) - half;
    if (dx <= 0 && dy <= 0) return true;
    const afstand = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
    if (afstand < straal) return true;
  }
  return false;
}

function binnenRand(x, y, straal) {
  const m = VELD.rand + straal;
  return x >= m && x <= VELD.breedte - m && y >= m && y <= VELD.hoogte - m;
}

// --- veld -----------------------------------------------------------------

export function maakVeld(obstakels) {
  /** Een cel is dicht als een cirkel met deze straal er niet vrij in past. */
  function celDicht(cx, cy, straal) {
    const { x, y } = celMidden(cx, cy);
    return !binnenRand(x, y, straal) || raaktObstakel(obstakels, x, y, straal);
  }

  /** Rasterkaart: true = hier mag je lopen. */
  function maakKaart(straal) {
    const kaart = new Uint8Array(KOLOMMEN * RIJEN);
    for (let cy = 0; cy < RIJEN; cy++) {
      for (let cx = 0; cx < KOLOMMEN; cx++) {
        kaart[cy * KOLOMMEN + cx] = celDicht(cx, cy, straal) ? 0 : 1;
      }
    }
    return kaart;
  }

  /**
   * Afstand (in cellen) van elke cel tot het doel, via een breadth-first zoek.
   * Eén keer uitrekenen is genoeg voor álle monsters: ze jagen allemaal op
   * dezelfde speler.
   */
  function maakAfstandsveld(doelX, doelY, straal) {
    const kaart = maakKaart(straal);
    const afstand = new Int16Array(KOLOMMEN * RIJEN).fill(-1);
    const { cx, cy } = celVan(doelX, doelY);

    let start = cy * KOLOMMEN + cx;
    if (!kaart[start]) {
      // Het doel staat zelf in een muur (kan als de speler net langs een berg
      // schuurt): pak de dichtstbijzijnde vrije cel als startpunt.
      let beste = -1;
      let besteAfstand = Infinity;
      for (let i = 0; i < kaart.length; i++) {
        if (!kaart[i]) continue;
        const m = celMidden(i % KOLOMMEN, Math.floor(i / KOLOMMEN));
        const d = Math.hypot(m.x - doelX, m.y - doelY);
        if (d < besteAfstand) {
          besteAfstand = d;
          beste = i;
        }
      }
      if (beste < 0) return null;
      start = beste;
    }

    afstand[start] = 0;
    const rij = [start];
    for (let kop = 0; kop < rij.length; kop++) {
      const i = rij[kop];
      const x = i % KOLOMMEN;
      const y = (i - x) / KOLOMMEN;
      // vier buren; schuin zou hoeken kunnen afsnijden dwars door een berg
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= KOLOMMEN || ny >= RIJEN) continue;
        const j = ny * KOLOMMEN + nx;
        if (!kaart[j] || afstand[j] >= 0) continue;
        afstand[j] = afstand[i] + 1;
        rij.push(j);
      }
    }
    return afstand;
  }

  /** Welke kant moet je op vanaf (x,y) om dichter bij het doel te komen? */
  function stapRichting(afstandsveld, x, y) {
    const { cx, cy } = celVan(x, y);
    const hier = afstandsveld[cy * KOLOMMEN + cx];

    let beste = null;
    let besteAfstand = hier < 0 ? Infinity : hier;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= KOLOMMEN || ny >= RIJEN) continue;
      const d = afstandsveld[ny * KOLOMMEN + nx];
      if (d >= 0 && d < besteAfstand) {
        besteAfstand = d;
        beste = celMidden(nx, ny);
      }
    }
    if (!beste) return null;

    const lengte = Math.hypot(beste.x - x, beste.y - y);
    return lengte === 0 ? null : { x: (beste.x - x) / lengte, y: (beste.y - y) / lengte };
  }

  /**
   * Loop een stapje en schuif langs de muren in plaats van er tegenaan te
   * blijven plakken: de assen worden apart geprobeerd.
   */
  function loop(x, y, dx, dy, straal) {
    let nx = x;
    let ny = y;
    if (dx !== 0 && binnenRand(nx + dx, ny, straal) && !raaktObstakel(obstakels, nx + dx, ny, straal)) {
      nx += dx;
    }
    if (dy !== 0 && binnenRand(nx, ny + dy, straal) && !raaktObstakel(obstakels, nx, ny + dy, straal)) {
      ny += dy;
    }
    return { x: nx, y: ny };
  }

  /**
   * Kun je dicht genoeg bij (x,y) komen om het op te pakken?
   *
   * Let op: niet "kun je er precies op gaan staan". De voorwerpen staan vlak
   * tegen de rand, waar het midden van een rastercel al in de marge valt, dus
   * die cel telt als muur. Je hoeft er ook niet op te staan — binnen pakStraal
   * is genoeg.
   */
  function bereikbaar(afstandsveld, x, y, reikwijdte = VOORWERP.pakStraal) {
    const { cx, cy } = celVan(x, y);
    const straalInCellen = Math.ceil(reikwijdte / CEL);
    for (let dy = -straalInCellen; dy <= straalInCellen; dy++) {
      for (let dx = -straalInCellen; dx <= straalInCellen; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= KOLOMMEN || ny >= RIJEN) continue;
        if (afstandsveld[ny * KOLOMMEN + nx] < 0) continue;
        const m = celMidden(nx, ny);
        if (Math.hypot(m.x - x, m.y - y) <= reikwijdte) return true;
      }
    }
    return false;
  }

  /** Zijn al deze punten te bereiken vanaf (vanX, vanY)? */
  function allesBereikbaar(vanX, vanY, punten, straal) {
    const afstandsveld = maakAfstandsveld(vanX, vanY, straal);
    if (!afstandsveld) return false;
    return punten.every((p) => bereikbaar(afstandsveld, p.x, p.y));
  }

  /**
   * De vrije plek die het verst van (x,y) ligt — om een monster neer te zetten.
   *
   * Alleen in de middenbaan: de verste hoek van het veld is altijd een hoek van
   * een voorwerpkolom, en een monster die pal op het doel gaat staan is geen
   * uitdaging maar een blokkade.
   */
  function versteVrijePlek(x, y, straal) {
    const vanX = VELD.kolomLinks + 16;
    const totX = VELD.kolomRechts - 16;
    let beste = { x: VELD.breedte / 2, y: VELD.hoogte / 2 };
    let besteAfstand = -1;
    for (let cy = 0; cy < RIJEN; cy++) {
      for (let cx = 0; cx < KOLOMMEN; cx++) {
        if (celDicht(cx, cy, straal)) continue;
        const m = celMidden(cx, cy);
        if (m.x < vanX || m.x > totX) continue;
        const d = Math.hypot(m.x - x, m.y - y);
        if (d > besteAfstand) {
          besteAfstand = d;
          beste = m;
        }
      }
    }
    return beste;
  }

  return {
    obstakels,
    maakAfstandsveld,
    stapRichting,
    loop,
    allesBereikbaar,
    versteVrijePlek,
    vrij: (x, y, straal) => binnenRand(x, y, straal) && !raaktObstakel(obstakels, x, y, straal),
  };
}

// --- niveau in elkaar zetten ----------------------------------------------

function strooiObstakels() {
  const aantal = Math.floor(willekeurig(OBSTAKEL.minimum, OBSTAKEL.maximum + 1));
  const obstakels = [];
  // Alleen in de middenbaan: de kolommen met voorwerpen moeten vrij blijven.
  const vanX = VELD.kolomLinks + 20;
  const totX = VELD.kolomRechts - 20;
  const marge = VELD.rand + OBSTAKEL.maat / 2;

  let pogingen = 0;
  while (obstakels.length < aantal && pogingen < 200) {
    pogingen++;
    const x = willekeurig(vanX, totX);
    const y = willekeurig(marge, VELD.hoogte - marge);
    // niet op elkaar, en niet zo dicht bij elkaar dat er een muur ontstaat
    if (obstakels.some((ob) => Math.hypot(ob.x - x, ob.y - y) < OBSTAKEL.maat * 1.8)) continue;
    obstakels.push({ x, y, cp: kies(OBSTAKEL.cps) });
  }
  return obstakels;
}

/**
 * Bouwt een compleet niveau en garandeert dat het uit te spelen is.
 *
 * Die garantie is het halve punt van dit bestand: een veld waarin één voorwerp
 * onbereikbaar ligt, is voor hem niet "moeilijk" maar kapot, en dat is precies
 * het soort ervaring waarop een kind afhaakt.
 */
export function maakNiveau(paren) {
  for (let poging = 0; poging < 50; poging++) {
    const obstakels = strooiObstakels();
    const veld = maakVeld(obstakels);

    const aantal = paren.length;
    const ruimte = VELD.hoogte - 2 * VELD.rand;
    const yVan = (i) => VELD.rand + (ruimte * (i + 0.5)) / aantal;

    const linksVoorwerpen = paren.map((paar, i) => ({
      paar,
      woord: paar.links,
      x: VELD.kolomLinks,
      y: yVan(i),
      thuisX: VELD.kolomLinks,
      thuisY: yVan(i),
      opgepakt: false,
      klaar: false,
      schud: 0,
    }));

    // De rechterkant staat in een andere volgorde, anders verraadt de hoogte
    // het antwoord.
    const rechtsVolgorde = husselen(paren.map((_, i) => i));
    const rechtsVoorwerpen = rechtsVolgorde.map((paarIndex, i) => ({
      paar: paren[paarIndex],
      woord: paren[paarIndex].rechts,
      x: VELD.kolomRechts,
      y: yVan(i),
      klaar: false,
      schud: 0,
    }));

    const spelerStart = { x: VELD.kolomLinks + 14, y: VELD.hoogte / 2 };
    if (!veld.vrij(spelerStart.x, spelerStart.y, 4)) continue;

    const teBereiken = [...linksVoorwerpen, ...rechtsVoorwerpen].map((v) => ({ x: v.x, y: v.y }));
    if (!veld.allesBereikbaar(spelerStart.x, spelerStart.y, teBereiken, 4)) continue;

    return {
      veld,
      obstakels,
      links: linksVoorwerpen,
      rechts: rechtsVoorwerpen,
      spelerStart,
      monsterStart: veld.versteVrijePlek(spelerStart.x, spelerStart.y, MONSTER.straal),
    };
  }
  // Onbereikbaar in de praktijk: zonder obstakels is alles altijd bereikbaar.
  return maakNiveauZonderObstakels(paren);
}

function maakNiveauZonderObstakels(paren) {
  const veld = maakVeld([]);
  const aantal = paren.length;
  const ruimte = VELD.hoogte - 2 * VELD.rand;
  const yVan = (i) => VELD.rand + (ruimte * (i + 0.5)) / aantal;
  const spelerStart = { x: VELD.kolomLinks + 14, y: VELD.hoogte / 2 };

  return {
    veld,
    obstakels: [],
    links: paren.map((paar, i) => ({
      paar,
      woord: paar.links,
      x: VELD.kolomLinks,
      y: yVan(i),
      thuisX: VELD.kolomLinks,
      thuisY: yVan(i),
      opgepakt: false,
      klaar: false,
      schud: 0,
    })),
    rechts: husselen(paren.map((_, i) => i)).map((paarIndex, i) => ({
      paar: paren[paarIndex],
      woord: paren[paarIndex].rechts,
      x: VELD.kolomRechts,
      y: yVan(i),
      klaar: false,
      schud: 0,
    })),
    spelerStart,
    monsterStart: veld.versteVrijePlek(spelerStart.x, spelerStart.y, MONSTER.straal),
  };
}
