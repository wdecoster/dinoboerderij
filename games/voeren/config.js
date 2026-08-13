// De knoppen van "Dino's voeren".
//
// Dit is het enige spel waarin hij een woord echt moet lézen. De andere drie
// vragen om een letter of een klank; hier staat er een woord en moet hij weten
// wat het betekent.

// Elke zoveelste keer goed levert een dino op, net als in Sorteren.
export const GOED_PER_DINO = 5;

// Hoelang je na een misser niets kunt aantikken, per misser in dezelfde beurt.
//
// Zonder pauze kan hij alle kaartjes achter elkaar aantikken tot er een blijft
// plakken — en dan speelt hij het spel uit zonder één woord te lezen. De pauze
// maakt gokken langzamer dan nadenken. In diezelfde pauze staat het woord van
// wat hij gáf op het kaartje: dat is het enige moment waarop hij twee woorden
// naast elkaar ziet, en dus waar hij iets kan leren.
//
// Oplopend, zodat één vergissing bijna niets kost maar alle kaartjes afgaan
// echt traag wordt. Zo raakt het de gokker en niet het kind dat één keer
// misgrijpt. De laatste waarde geldt voor elke volgende misser.
export const MISSER_PAUZES = [1300, 2500, 4000];

/**
 * De moeilijkheid zit hem niet in het woord maar in de afleiders.
 *
 * Bij "kat" naast "boom" en "vis" heb je aan de eerste letter genoeg — en dat
 * kan hij al. Bij "boom" naast "boot" en "boek" moet je tot het eind lezen. Zo
 * loopt het spel van wat hij kan naar wat hij moet leren, zonder dat er ooit
 * een muur staat.
 *
 * `vanaf`      aantal keer goed
 * `lengtes`    hoe lang de woorden mogen zijn
 * `keuzes`     hoeveel plaatjes er op de plank liggen
 * `afleiders`  hoe erg de afleiders op het goede woord lijken
 */
export const NIVEAUS = [
  { vanaf: 0, lengtes: [3], keuzes: 2, afleiders: 'anders' },
  { vanaf: 5, lengtes: [3], keuzes: 3, afleiders: 'anders' },
  { vanaf: 12, lengtes: [3], keuzes: 3, afleiders: 'zelfdeLetter' },
  { vanaf: 22, lengtes: [3, 4], keuzes: 3, afleiders: 'zelfdeLetter' },
  { vanaf: 35, lengtes: [4], keuzes: 4, afleiders: 'zelfdeLetter' },
  { vanaf: 50, lengtes: [4, 5], keuzes: 4, afleiders: 'lijkterop' },
  { vanaf: 70, lengtes: [4, 5, 6], keuzes: 4, afleiders: 'lijkterop' },
];

export function niveauVoor(aantalGoed) {
  let gekozen = NIVEAUS[0];
  for (const niveau of NIVEAUS) {
    if (aantalGoed >= niveau.vanaf) gekozen = niveau;
  }
  return gekozen;
}

// Hoeveel woorden we onthouden om niet te herhalen.
export const MAX_GEHEUGEN = 8;

export const STANDAARD_LENGTE = 'auto';
