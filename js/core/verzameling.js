// De dinoverzameling, gedeeld door alle spellen.
//
// De dino's zijn de beloning van het hele project: in de Woordbouwer komt er een
// uit een ei, in Sorteren en Voeren verdien je er een na een reeks goede
// antwoorden, en in Rijmen als je een veld uitspeelt. Ze staan allemaal in
// dezelfde verzameling, zodat het één kudde is en niet vier lijstjes.
//
// Elke dino is een eigen beestje met een plek waar hij rondloopt. Vroeger was
// het een telling per soort-en-kleur; dat werd omgezet zodra je de verzameling
// voor het eerst opent, zonder dat er iets verloren gaat.

import { maakOpslag } from './storage.js';
import { SOORTEN, TINTEN } from '../data/dinos.js';
import { willekeurigePlek, STANDAARD_PLEK, PLEKKEN } from '../data/plekken.js';

const opslag = maakOpslag('dinos');

/**
 * Alle dino's: [{ cp, tint, plek }].
 *
 * De oude vorm was { "cp|tint": aantal }. Die wordt hier uitgevouwen naar losse
 * beestjes met een willekeurige plek, zodat een bestaande kudde gewoon
 * meeverhuist in plaats van te verdwijnen.
 */
export function leesVerzameling() {
  const rauw = opslag.lees('verzameling', []);
  if (Array.isArray(rauw)) return rauw;

  const uitgevouwen = [];
  for (const [sleutel, aantal] of Object.entries(rauw ?? {})) {
    const [cp, tint] = sleutel.split('|');
    for (let i = 0; i < aantal; i++) {
      uitgevouwen.push({ cp, tint: Number(tint), plek: willekeurigePlek() });
    }
  }
  opslag.schrijf('verzameling', uitgevouwen);
  return uitgevouwen;
}

export function aantalDinos() {
  return leesVerzameling().length;
}

/** Alle dino's op één plek. */
export function dinosOpPlek(plekId) {
  return leesVerzameling().filter((d) => (d.plek ?? STANDAARD_PLEK) === plekId);
}

/** Hoeveel dino's er per plek zijn: { boerderij: 3, pretpark: 1, ... } */
export function aantalPerPlek() {
  const telling = Object.fromEntries(PLEKKEN.map((p) => [p.id, 0]));
  for (const dino of leesVerzameling()) {
    const plek = dino.plek ?? STANDAARD_PLEK;
    telling[plek] = (telling[plek] ?? 0) + 1;
  }
  return telling;
}

/** Verdient een nieuwe dino en zet hem op een willekeurige plek. */
export function verdienDino() {
  const soort = SOORTEN[Math.floor(Math.random() * SOORTEN.length)];
  const tint = TINTEN[Math.floor(Math.random() * TINTEN.length)];
  const plek = willekeurigePlek();

  const verzameling = leesVerzameling();
  verzameling.push({ cp: soort.cp, tint, plek });
  opslag.schrijf('verzameling', verzameling);

  return { soort, tint, plek };
}

/** Gooit de hele kudde weg. Onomkeerbaar — vraag het eerst even na. */
export function wisVerzameling() {
  opslag.schrijf('verzameling', []);
}

/**
 * Wist óók de voortgang van de spellen: de moeilijkheid van de Woordbouwer en
 * Voeren, de snelheidsniveaus en topscores van Sorteren en de beste tijden van
 * Rijmen.
 *
 * Wat blijft staan is alles wat de ouder heeft ingesteld — welke plaatjes aan
 * of uit staan, welk letterpaar, of de monsters meedoen. Dat is handwerk dat je
 * niet kwijt wilt raken omdat je de wei wilde opruimen.
 */
export function wisVoortgang() {
  wisVerzameling();

  const isVoortgang = (naam) =>
    naam === 'goed' || naam.startsWith('niveau:') || naam.startsWith('beste:');

  for (const ruimte of ['bouw', 'sorteer', 'rijm', 'voeren']) {
    maakOpslag(ruimte).verwijderWaar(isVoortgang);
  }
}

/** Dezelfde tekening, andere kleur. */
export function tintFilter(tint) {
  return Number(tint) ? `hue-rotate(${tint}deg) saturate(1.3)` : '';
}

/**
 * Vult een <ul> met de verzameling, gegroepeerd op soort en kleur. Geef een
 * plek mee om alleen die plek te tonen.
 */
export function vulDinolijst(lijst, regel, plaatjePad, plekId = null) {
  const dinos = plekId ? dinosOpPlek(plekId) : leesVerzameling();

  const groepen = new Map();
  for (const dino of dinos) {
    const sleutel = `${dino.cp}|${dino.tint}`;
    groepen.set(sleutel, (groepen.get(sleutel) ?? 0) + 1);
  }

  if (regel) {
    const soorten = new Set([...groepen.keys()].map((s) => s.split('|')[0])).size;
    regel.textContent =
      dinos.length === 0
        ? 'Nog geen dino. Speel een spel!'
        : `${dinos.length} ${dinos.length === 1 ? 'dino' : "dino's"} · ` +
          `${soorten} ${soorten === 1 ? 'soort' : 'soorten'} · ` +
          `${groepen.size} ${groepen.size === 1 ? 'kleur' : 'kleuren'}`;
  }

  lijst.replaceChildren();
  for (const [sleutel, aantal] of groepen) {
    const [cp, tint] = sleutel.split('|');
    const soort = SOORTEN.find((s) => s.cp === cp);
    if (!soort) continue;

    const item = document.createElement('li');
    item.className = 'dino';

    const img = document.createElement('img');
    img.src = plaatjePad(cp);
    img.alt = '';
    img.style.filter = tintFilter(tint);

    const naam = document.createElement('span');
    naam.className = 'dino__naam';
    naam.textContent = aantal > 1 ? `${soort.naam} ×${aantal}` : soort.naam;

    item.append(img, naam);
    lijst.append(item);
  }
}
