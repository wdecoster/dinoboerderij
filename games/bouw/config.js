// De knoppen van de Woordbouwer. De dino's zelf staan in js/data/dinos.js,
// want die worden in alle spellen verdiend.

// Na hoeveel misgrepen bij dezelfde letter we een handje helpen door de goede
// letter te laten meebewegen. Vastlopen is het enige wat echt misgaat.
export const HINT_NA = 3;

// Hoeveel woorden er in één ei zitten.
//
// Eén woord per dino ging veel te hard: een woord kost een seconde of tien,
// terwijl je in Sorteren vijf goede antwoorden nodig hebt en in Rijmen een heel
// veld moet uitspelen. Met drie woorden per ei kost een dino overal ongeveer
// evenveel moeite.
export const WOORDEN_PER_DINO = 3;

// --- moeilijker worden ----------------------------------------------------

// Hoe meer dino's hij hier heeft uitgebroed, hoe zwaarder het werk. Dat telt
// alleen wat hij in dít spel verdiend heeft: anders zou een middagje Sorteren
// hem hier ineens voor woorden van vijf letters zetten.
//
// `vanaf` = aantal woorden goed, `lengtes` = woordlengtes die dan meedoen,
// `afleiders` = hoeveel letters erbij liggen die niet in het woord zitten.
export const NIVEAUS = [
  { vanaf: 0, lengtes: [3], afleiders: 0 },
  { vanaf: 5, lengtes: [3], afleiders: 1 },
  { vanaf: 10, lengtes: [3, 4], afleiders: 2 },
  { vanaf: 18, lengtes: [4], afleiders: 2 },
  { vanaf: 28, lengtes: [4, 5], afleiders: 3 },
  { vanaf: 40, lengtes: [5], afleiders: 3 },
];

/** Welk niveau hoort bij dit aantal goede woorden? */
export function niveauVoor(aantalGoed) {
  let gekozen = NIVEAUS[0];
  for (const niveau of NIVEAUS) {
    if (aantalGoed >= niveau.vanaf) gekozen = niveau;
  }
  return gekozen;
}

// Letters die op elkaar lijken of hetzelfde klinken. Een afleider die hierin
// staat is veel meer waard dan een willekeurige letter: bij "bus" een d
// neerleggen oefent precies waar hij over struikelt.
export const VERWARREND = {
  b: ['d', 'p'],
  d: ['b', 'p'],
  p: ['q', 'b'],
  q: ['p', 'g'],
  m: ['n', 'w'],
  n: ['m', 'u'],
  u: ['n', 'v'],
  v: ['w', 'f'],
  w: ['v', 'm'],
  f: ['v'],
  s: ['z'],
  z: ['s'],
  g: ['k', 'q'],
  k: ['g'],
  t: ['d'],
  a: ['e'],
  e: ['a'],
  o: ['e'],
  i: ['j'],
  j: ['i'],
};

// Waar afleiders uit komen als er geen verwarrende letter meer over is.
export const ALFABET = 'abdeghijklmnoprstuvwz'.split('');

// --- de rondwandelende kudde ----------------------------------------------

export const PARADE = {
  maximum: 12, // meer dan dit wordt een drukte van belang
  maat: 46, // pixels
  snelheid: [8, 20], // pixels per seconde, willekeurig hiertussen
  marge: 8, // hoe dicht ze bij de schermrand mogen komen
};

export const STANDAARD_LENGTE = 'auto';
