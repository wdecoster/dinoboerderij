// Het register van spelletjes. Dit is het enige bestand dat je aanraakt als er
// een spel bij komt: nieuwe map onder games/, één regel hier.

export const spellen = [
  {
    id: 'sorteer',
    naam: 'Sorteren',
    uitleg: 'Er valt iets. Links of rechts, op de eerste letter.',
    icoon: '1f333', // boom
    pad: 'games/sorteer/',
  },
  {
    id: 'rijm',
    naam: 'Rijmen',
    uitleg: 'Zoek rijmende voorwerpen, maar pas op voor de monsters!',
    icoon: '1f47b', // spook
    pad: 'games/rijm/',
  },
  {
    id: 'bouw',
    naam: 'Woordbouwer',
    uitleg: 'Bouw het woord uit letters. Er komt een dino uit het ei!',
    icoon: '1f95a', // ei
    pad: 'games/bouw/',
  },
  {
    id: 'voeren',
    naam: "Dino's voeren",
    uitleg: 'Lees het woord en geef je dino het goede ding.',
    icoon: '1f34e', // appel
    pad: 'games/voeren/',
  },
];
