// De dinoverzameling, gedeeld door alle spellen.
//
// De dino's zijn de beloning van het hele project: in de Woordbouwer komt er een
// uit een ei, in Sorteren verdien je er een na een reeks goede antwoorden, en in
// Rijmen krijg je er een als je alles gevonden hebt. Ze staan allemaal in
// dezelfde verzameling, zodat het één kudde is en niet drie losse lijstjes.
//
// Bewaard onder leesspel:dinos, dus los van de opslag van een individueel spel.

import { maakOpslag } from './storage.js';
import { SOORTEN, TINTEN } from '../data/dinos.js';

const opslag = maakOpslag('dinos');

/** { "cp|tint": aantal } */
export function leesVerzameling() {
  return opslag.lees('verzameling', {});
}

export function aantalDinos() {
  return Object.values(leesVerzameling()).reduce((som, n) => som + n, 0);
}

/** Verdient een nieuwe dino en zet hem in de verzameling. */
export function verdienDino() {
  const soort = SOORTEN[Math.floor(Math.random() * SOORTEN.length)];
  const tint = TINTEN[Math.floor(Math.random() * TINTEN.length)];
  const sleutel = `${soort.cp}|${tint}`;

  const verzameling = leesVerzameling();
  verzameling[sleutel] = (verzameling[sleutel] ?? 0) + 1;
  opslag.schrijf('verzameling', verzameling);

  return { soort, tint, sleutel };
}

/**
 * Gooit de hele kudde weg. Onomkeerbaar — vraag het eerst even na.
 *
 * Bestaat vooral omdat je na een middagje uitproberen honderden dino's hebt en
 * dan niet fatsoenlijk meer kunt kijken hoe het er met een lege wei uitziet.
 */
export function wisVerzameling() {
  opslag.schrijf('verzameling', {});
}

/**
 * Wist óók de voortgang van de spellen: de moeilijkheid van de Woordbouwer, de
 * snelheidsniveaus en topscores van Sorteren en de beste tijden van Rijmen.
 *
 * Wat blijft staan is alles wat de ouder heeft ingesteld — welke plaatjes aan
 * of uit staan, welk letterpaar, of de monsters meedoen. Dat is handwerk dat je
 * niet kwijt wilt raken omdat je de wei wilde opruimen.
 */
export function wisVoortgang() {
  wisVerzameling();

  const isVoortgang = (naam) =>
    naam === 'goed' || naam.startsWith('niveau:') || naam.startsWith('beste:');

  for (const ruimte of ['bouw', 'sorteer', 'rijm']) {
    maakOpslag(ruimte).verwijderWaar(isVoortgang);
  }
}

/** Dezelfde tekening, andere kleur. */
export function tintFilter(tint) {
  return Number(tint) ? `hue-rotate(${tint}deg) saturate(1.3)` : '';
}

/**
 * Vult een <ul> met de hele verzameling. Alle drie de spellen laten hetzelfde
 * scherm zien, dus dat staat hier één keer.
 */
export function vulDinolijst(lijst, regel, plaatjePad) {
  const verzameling = leesVerzameling();
  const sleutels = Object.keys(verzameling);
  const totaal = sleutels.reduce((som, s) => som + verzameling[s], 0);

  if (regel) {
    // Soorten en kleuren apart tellen: "20 soorten en kleuren" leest alsof er
    // twintig soorten zijn, terwijl het er vijf in twintig kleuren kunnen zijn.
    const soorten = new Set(sleutels.map((s) => s.split('|')[0])).size;
    regel.textContent =
      totaal === 0
        ? 'Nog geen dino. Speel een spel!'
        : `${totaal} ${totaal === 1 ? 'dino' : "dino's"} · ` +
          `${soorten} ${soorten === 1 ? 'soort' : 'soorten'} · ` +
          `${sleutels.length} ${sleutels.length === 1 ? 'kleur' : 'kleuren'}`;
  }

  lijst.replaceChildren();
  for (const sleutel of sleutels) {
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
    naam.textContent =
      verzameling[sleutel] > 1 ? `${soort.naam} ×${verzameling[sleutel]}` : soort.naam;

    item.append(img, naam);
    lijst.append(item);
  }
}
