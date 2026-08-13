// De knoppen van de Zoekplaat.
//
// Dit is het rustige spel: geen klok, geen tegenstander, geen manier om te
// verliezen. Je zoekt tot je alles gevonden hebt. Het is ook het enige spel
// zonder animatielus — de plaat staat gewoon stil — wat op een oude tablet
// scheelt.

// Zoveel plaatjes op rij goed gevonden levert een dino op. Een ronde duurt
// langer dan een beurt in de andere spellen, dus zijn het er minder.
export const RONDES_PER_DINO = 3;

// Hoelang je na een misgreep even niets kunt aantikken, oplopend binnen dezelfde
// ronde. Zonder rem tik je gewoon de hele plaat aan en heb je alles "gevonden".
export const MISSER_PAUZES = [900, 1800, 3000];

/**
 * Hoe vol wordt de plaat, en hoe gemeen zijn de afleiders?
 *
 * `dingen`    hoeveel plaatjes er in totaal liggen
 * `doelen`    hoeveel daarvan met de gezochte letter beginnen
 * `afleiders` 'anders'    = de rest begint met een duidelijk andere letter
 *             'lijkterop' = de rest begint met een letter die op de gezochte
 *                           lijkt (b naast d en p), zodat zoeken pas telt als
 *                           je echt kijkt
 */
export const NIVEAUS = [
  { vanaf: 0, dingen: 9, doelen: 3, afleiders: 'anders' },
  { vanaf: 3, dingen: 12, doelen: 4, afleiders: 'anders' },
  { vanaf: 8, dingen: 15, doelen: 4, afleiders: 'lijkterop' },
  { vanaf: 15, dingen: 18, doelen: 5, afleiders: 'lijkterop' },
  { vanaf: 25, dingen: 22, doelen: 6, afleiders: 'lijkterop' },
];

export function niveauVoor(aantalRondes) {
  let gekozen = NIVEAUS[0];
  for (const niveau of NIVEAUS) {
    if (aantalRondes >= niveau.vanaf) gekozen = niveau;
  }
  return gekozen;
}

// Waar de plaatjes mogen liggen, in procenten van de plaat. De onderrand blijft
// vrij voor de balk met de gezochte letter.
export const VLAK = { links: 4, rechts: 96, boven: 6, onder: 94 };

// Minimale afstand tussen twee plaatjes, in procenten. Ze mogen elkaar niet
// raken: op een tablet moet duidelijk zijn wat je aantikt.
export const MIN_AFSTAND = 13;

// De letters die gezocht kunnen worden. Alleen letters waar genoeg woorden bij
// horen; q, x en y hebben in het Nederlands nauwelijks kindwoorden.
export const LETTERS = 'bdkmpstvhrlgzwfna'.split('');
