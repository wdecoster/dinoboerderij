// De plekken waar de dino's rondlopen.
//
// Eén wei liep te snel vol, en drie plekken is ook gewoon leuker: elke nieuwe
// dino gaat ergens anders heen, dus er valt iets te ontdekken. Elke plek is
// dezelfde scène-code met andere kleuren en ander decor.
//
// `grond`/`grondVlek` zijn de gras- of tegelkleur, `water` is een plas of bad,
// `hek` zet een omheining rondom, en `decor` staat op vaste plekken zodat elke
// plek herkenbaar blijft.

export const PLEKKEN = [
  {
    id: 'boerderij',
    naam: 'boerderij',
    pad: 'boerderij/',
    icoon: '1f3e1',
    grond: '#e3f0d5',
    grondVlek: '#d5e8c4',
    hek: true,
    water: { x: 34, y: 74, rx: 17, ry: 9, kleur: '#bfe3f2', rand: '#9ccde2' },
    decor: [
      { cp: '1f3e1', x: 24, y: 15, maat: 20 },
      { cp: '1f333', x: 128, y: 16, maat: 15 },
      { cp: '1f333', x: 112, y: 13, maat: 11 },
      { cp: '1f33b', x: 46, y: 24, maat: 7 },
      { cp: '1f33c', x: 54, y: 21, maat: 6 },
      { cp: '1f33c', x: 136, y: 62, maat: 6 },
      { cp: '1f344', x: 18, y: 74, maat: 6 },
      { cp: '1faa8', x: 96, y: 84, maat: 9 },
      { cp: '1f335', x: 138, y: 34, maat: 9 },
    ],
  },
  {
    id: 'pretpark',
    naam: 'pretpark',
    pad: 'pretpark/',
    icoon: '1f3a1',
    grond: '#f6ecf6',
    grondVlek: '#eddff0',
    hek: false,
    water: null,
    decor: [
      { cp: '1f3a1', x: 30, y: 20, maat: 24 }, // reuzenrad
      { cp: '1f3a2', x: 118, y: 21, maat: 22 }, // achtbaan
      { cp: '1f3a0', x: 74, y: 17, maat: 16 }, // draaimolen
      { cp: '1f3aa', x: 20, y: 78, maat: 16 }, // circustent
      { cp: '1f388', x: 52, y: 34, maat: 8 },
      { cp: '1f388', x: 138, y: 52, maat: 8 },
      { cp: '1f36d', x: 96, y: 86, maat: 8 },
      { cp: '1f367', x: 132, y: 84, maat: 8 },
      { cp: '1f3af', x: 60, y: 86, maat: 9 },
    ],
  },
  {
    id: 'zwembad',
    naam: 'zwembad',
    pad: 'zwembad/',
    icoon: '1f3ca',
    grond: '#f7efdc',
    grondVlek: '#efe4c9',
    hek: false,
    // Het bad is hier het hoofdgerecht, dus flink wat groter dan de vijver.
    water: { x: 78, y: 60, rx: 46, ry: 24, kleur: '#bfe3f2', rand: '#8fc4dd' },
    decor: [
      { cp: '26f1', x: 22, y: 34, maat: 16 }, // parasol
      { cp: '26f1', x: 136, y: 32, maat: 14 },
      { cp: '1f334', x: 14, y: 74, maat: 15 }, // palmboom
      { cp: '1f334', x: 142, y: 76, maat: 13 },
      { cp: '1f3d0', x: 60, y: 24, maat: 8 }, // bal
      { cp: '1f379', x: 96, y: 22, maat: 8 },
      { cp: '1f420', x: 66, y: 62, maat: 8 }, // visje in het water
      { cp: '1f420', x: 92, y: 68, maat: 7 },
    ],
  },
];

export const STANDAARD_PLEK = 'boerderij';

export function plekVan(id) {
  return PLEKKEN.find((p) => p.id === id) ?? PLEKKEN[0];
}

/** Een willekeurige plek voor een nieuwe dino. */
export function willekeurigePlek() {
  return PLEKKEN[Math.floor(Math.random() * PLEKKEN.length)].id;
}

/** Alle codepoints van het decor (voor tools/haal-emoji.mjs). */
export function plekCodepoints() {
  return PLEKKEN.flatMap((p) => [p.icoon, ...p.decor.map((d) => d.cp)]);
}
