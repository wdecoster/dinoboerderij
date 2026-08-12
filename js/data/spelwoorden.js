// Woorden om te spellen, gesorteerd op lengte.
//
// Hij kent losse letters goed maar kan een woord nog niet lezen. Zelf een woord
// bouwen uit letters draait het om: hij hoeft niet te ontcijferen wat er staat,
// hij zegt zelf wat hij ziet en zoekt daar de letters bij. Dat is precies de
// stap richting lezen die met alleen kijken en luisteren niet komt.
//
// Alleen klankzuivere woorden: woorden die je schrijft zoals je ze zegt. Een
// woord als "trein" of "hond" klopt niet letter-voor-letter met de klanken en
// hoort hier (nog) niet thuis.
//
// standaard: false = uit bij de start, omdat het plaatje ook anders kan heten.

export const spelwoorden = [
  // --- drie letters ---
  { woord: 'aap', cp: '1f412' },
  { woord: 'bal', cp: '26bd', standaard: false }, // of "voetbal"
  { woord: 'bed', cp: '1f6cf' },
  { woord: 'bel', cp: '1f514' },
  { woord: 'bot', cp: '1f9b4' },
  { woord: 'bus', cp: '1f68c' },
  { woord: 'ijs', cp: '1f366', standaard: false }, // of "ijsje"
  { woord: 'jas', cp: '1f9e5' },
  { woord: 'kat', cp: '1f431' },
  { woord: 'kip', cp: '1f414' },
  { woord: 'mes', cp: '1f52a' },
  { woord: 'net', cp: '1f945', standaard: false }, // --- vier letters ---
  { woord: 'oma', cp: '1f475' },
  { woord: 'oog', cp: '1f441' },
  { woord: 'oor', cp: '1f442' },
  { woord: 'opa', cp: '1f474' }, // --- vijf letters ---
  { woord: 'pen', cp: '1f58a' },
  { woord: 'pot', cp: '1fad5', standaard: false },
  { woord: 'rat', cp: '1f400' },
  { woord: 'sok', cp: '1f9e6' },
  { woord: 'tas', cp: '1f45c' },
  { woord: 'vis', cp: '1f41f' },
  { woord: 'zon', cp: '2600' },

  // --- vier letters ---
  { woord: 'bank', cp: '1f4b5', standaard: false },
  { woord: 'beer', cp: '1f43b' },
  { woord: 'berg', cp: '26f0' },
  { woord: 'boek', cp: '1f4d6' },
  { woord: 'boom', cp: '1f333' },
  { woord: 'boot', cp: '1f6a4' },
  { woord: 'bril', cp: '1f453' },
  { woord: 'deur', cp: '1f6aa' },
  { woord: 'doos', cp: '1f4e6', standaard: false }, // of "pakje"
  { woord: 'drum', cp: '1f941' },
  { woord: 'duif', cp: '1f54a', standaard: false }, // of "vogel"
  { woord: 'duim', cp: '1f44d' },
  { woord: 'geit', cp: '1f410' },
  { woord: 'haan', cp: '1f413' },
  { woord: 'hand', cp: '270b' },
  { woord: 'huis', cp: '1f3e0' },
  { woord: 'kaas', cp: '1f9c0' },
  { woord: 'kers', cp: '1f352' },
  { woord: 'koek', cp: '1f36a' },
  { woord: 'krab', cp: '1f980' },
  { woord: 'lamp', cp: '1f4a1' },
  { woord: 'maan', cp: '1f319' },
  { woord: 'mand', cp: '1f9fa' },
  { woord: 'mier', cp: '1f41c' },
  { woord: 'mond', cp: '1f444' },
  { woord: 'muis', cp: '1f42d' },
  { woord: 'munt', cp: '1fa99' },
  { woord: 'muts', cp: '1f9e2' },
  { woord: 'neus', cp: '1f443' },
  { woord: 'peer', cp: '1f350' },
  { woord: 'raam', cp: '1fa9f' },
  { woord: 'roos', cp: '1f339' },
  { woord: 'rots', cp: '1faa8' },
  { woord: 'slak', cp: '1f40c' },
  { woord: 'slot', cp: '1f512' },
  { woord: 'soep', cp: '1f372' },
  { woord: 'spin', cp: '1f577' },
  { woord: 'ster', cp: '2b50' },
  { woord: 'tand', cp: '1f9b7' },
  { woord: 'tong', cp: '1f445' },
  { woord: 'tulp', cp: '1f337' },
  { woord: 'vlag', cp: '1f6a9' },
  { woord: 'voet', cp: '1f9b6' },
  { woord: 'vork', cp: '1f374' },
  { woord: 'vuur', cp: '1f525' },
  { woord: 'wolk', cp: '2601' },
  { woord: 'zeep', cp: '1f9fc' },
  { woord: 'zout', cp: '1f9c2' },

  // --- vijf letters ---
  { woord: 'appel', cp: '1f34e' },
  { woord: 'bloem', cp: '1f33c' },
  { woord: 'draak', cp: '1f409' },
  { woord: 'emmer', cp: '1faa3' },
  { woord: 'hamer', cp: '1f528' },
  { woord: 'kaars', cp: '1f56f' },
  { woord: 'kaart', cp: '1f5fa' },
  { woord: 'kroon', cp: '1f451' },
  { woord: 'lepel', cp: '1f944' },
  { woord: 'lolly', cp: '1f36d' },
  { woord: 'plant', cp: '1f331', standaard: false },
  { woord: 'schip', cp: '1f6a2' },
  { woord: 'stoel', cp: '1fa91' },
  { woord: 'taart', cp: '1f370' },
  // --- zes letters ---
  { woord: 'kikker', cp: '1f438' },
  { woord: 'wortel', cp: '1f955' },
  { woord: 'ladder', cp: '1fa9c' },
  { woord: 'tomaat', cp: '1f345' },
  { woord: 'banaan', cp: '1f34c' },
  { woord: 'ananas', cp: '1f34d' },
  { woord: 'meloen', cp: '1f348' },
  { woord: 'kompas', cp: '1f9ed' },
  { woord: 'koffer', cp: '1f9f3' },
  { woord: 'gitaar', cp: '1f3b8' },
  { woord: 'schoen', cp: '1f45f' },
  { woord: 'konijn', cp: '1f430' },

  // --- zeven letters ---
  { woord: 'vlinder', cp: '1f98b' },
  { woord: 'olifant', cp: '1f418' },
  { woord: 'dolfijn', cp: '1f42c' },
  { woord: 'trompet', cp: '1f3ba' },
  { woord: 'paraplu', cp: '2602' },
  { woord: 'pinguin', cp: '1f427' },
  { woord: 'garnaal', cp: '1f990' },
];

/** Alle codepoints die deze woorden nodig hebben (voor de download-tool). */
export function spelwoordCodepoints() {
  return spelwoorden.map((w) => w.cp);
}

export function woordStandaardAan(woord) {
  return woord.standaard !== false;
}

export function woordenMetLengte(lengte) {
  return spelwoorden.filter((w) => w.woord.length === lengte);
}

/** Welke woordlengtes zitten er in de lijst? */
export const LENGTES = [3, 4, 5, 6, 7];
