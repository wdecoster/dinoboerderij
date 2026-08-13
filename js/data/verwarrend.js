// Letters die op elkaar lijken of hetzelfde klinken.
//
// Gebruikt om afleiders te kiezen die ergens op slaan. Bij "bus" is een d een
// veel nuttigere afleider dan een willekeurige x, want dat is precies de
// verwarring die geoefend wordt. De Woordbouwer gebruikt het voor de losse
// letters, de Zoekplaat voor de beginletters van de afleiders.

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
