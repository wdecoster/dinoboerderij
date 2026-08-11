// De dino's die je in alle spellen kunt verdienen.
//
// Negen soorten × acht kleuren = 72 verschillende beesten. De kleur wordt met
// hue-rotate uit hetzelfde plaatje gedraaid, dus het kost geen extra bestand.

export const SOORTEN = [
  { cp: '1f995', naam: 'langnek' },
  { cp: '1f996', naam: 't-rex' },
  { cp: '1f409', naam: 'draak' },
  { cp: '1f432', naam: 'drakenkop' },
  { cp: '1f98e', naam: 'hagedis' },
  { cp: '1f40a', naam: 'krokodil' },
  { cp: '1f422', naam: 'schildpad' },
  { cp: '1f9a3', naam: 'mammoet' },
  { cp: '1f9a4', naam: 'dodo' },
];

export const TINTEN = [0, 40, 85, 140, 190, 240, 290, 320]; // graden hue-rotate

export const EI_CP = '1f95a'; // het ei dat openbarst

/** Alle codepoints die de dino's nodig hebben (voor tools/haal-emoji.mjs). */
export function dinoCodepoints() {
  return [...SOORTEN.map((s) => s.cp), EI_CP];
}
