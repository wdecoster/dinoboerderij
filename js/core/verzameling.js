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

/** Een kort eigen kenmerk, zodat je een dino kunt aanwijzen om te hernoemen. */
function nieuwId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Alle dino's: [{ id, cp, tint, plek, naam? }].
 *
 * De oude vorm was { "cp|tint": aantal }. Die wordt hier uitgevouwen naar losse
 * beestjes, zodat een bestaande kudde gewoon meeverhuist in plaats van te
 * verdwijnen. Dino's van vóór de namen krijgen alsnog een id.
 */
export function leesVerzameling() {
  const rauw = opslag.lees('verzameling', []);

  if (Array.isArray(rauw)) {
    // Ouder dan de namen? Dan hebben ze nog geen id.
    if (rauw.some((d) => !d.id)) {
      const metId = rauw.map((d) => (d.id ? d : { ...d, id: nieuwId() }));
      opslag.schrijf('verzameling', metId);
      return metId;
    }
    return rauw;
  }

  const uitgevouwen = [];
  for (const [sleutel, aantal] of Object.entries(rauw ?? {})) {
    const [cp, tint] = sleutel.split('|');
    for (let i = 0; i < aantal; i++) {
      uitgevouwen.push({ id: nieuwId(), cp, tint: Number(tint), plek: willekeurigePlek() });
    }
  }
  opslag.schrijf('verzameling', uitgevouwen);
  return uitgevouwen;
}

/** Hoe heet dit beest? Zonder eigen naam is dat gewoon zijn soort. */
export function naamVan(dino) {
  if (dino.naam) return dino.naam;
  return SOORTEN.find((s) => s.cp === dino.cp)?.naam ?? 'dino';
}

/** Geeft een dino een naam. Leeg maken zet hem terug op zijn soortnaam. */
export function noemDino(id, naam) {
  const verzameling = leesVerzameling();
  const dino = verzameling.find((d) => d.id === id);
  if (!dino) return;

  const schoon = naam.trim().slice(0, MAX_NAAM);
  if (schoon) dino.naam = schoon;
  else delete dino.naam;

  opslag.schrijf('verzameling', verzameling);
}

export const MAX_NAAM = 12;

// Voor wie niet wil of kan typen: één tik en hij heeft een naam.
export const NAAMIDEEEN = [
  'Rex', 'Bonk', 'Pluk', 'Nootje', 'Snuf', 'Wobbel', 'Tikkie', 'Bram',
  'Stampie', 'Knabbel', 'Pip', 'Gonzo', 'Loeki', 'Bibi', 'Struik', 'Dender',
  'Krokus', 'Fien', 'Tom', 'Muppie', 'Zoef', 'Bolle', 'Kiki', 'Reus',
];

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
  verzameling.push({ id: nieuwId(), cp: soort.cp, tint, plek });
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
 * Vult een <ul> met de verzameling: een kaartje per dino. Geef een plek mee om
 * alleen die plek te tonen, en `opTik` om de kaartjes aantikbaar te maken.
 */
export function vulDinolijst(lijst, regel, plaatjePad, plekId = null, opTik = null) {
  const dinos = plekId ? dinosOpPlek(plekId) : leesVerzameling();

  if (regel) {
    const soorten = new Set(dinos.map((d) => d.cp)).size;
    const kleuren = new Set(dinos.map((d) => `${d.cp}|${d.tint}`)).size;
    regel.textContent =
      dinos.length === 0
        ? 'Nog geen dino. Speel een spel!'
        : `${dinos.length} ${dinos.length === 1 ? 'dino' : "dino's"} · ` +
          `${soorten} ${soorten === 1 ? 'soort' : 'soorten'} · ` +
          `${kleuren} ${kleuren === 1 ? 'kleur' : 'kleuren'}`;
  }

  // Eén kaartje per beest, niet per soort: je geeft een náám aan een dino, niet
  // aan een groepje van drie dat toevallig dezelfde kleur heeft.
  lijst.replaceChildren();
  for (const dino of dinos) {
    const soort = SOORTEN.find((s) => s.cp === dino.cp);
    if (!soort) continue;

    const item = document.createElement('li');
    const kaart = document.createElement(opTik ? 'button' : 'div');
    kaart.className = 'dino';
    if (opTik) {
      kaart.type = 'button';
      kaart.addEventListener('click', () => opTik(dino));
    }

    const img = document.createElement('img');
    img.src = plaatjePad(dino.cp);
    img.alt = '';
    img.style.filter = tintFilter(dino.tint);

    const naam = document.createElement('span');
    naam.className = 'dino__naam';
    naam.textContent = naamVan(dino);

    kaart.append(img, naam);

    // Heeft hij een eigen naam, dan staat de soort er klein onder.
    if (dino.naam) {
      const soortnaam = document.createElement('span');
      soortnaam.className = 'dino__soort';
      soortnaam.textContent = soort.naam;
      kaart.append(soortnaam);
    }

    item.append(kaart);
    lijst.append(item);
  }
}
