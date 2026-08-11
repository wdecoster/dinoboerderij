// De rijmparen. Net als bij de woordenbank geldt: de code is maar code, deze
// lijst bepaalt of het spel werkt.
//
// Een rijm klopt alleen als hij precies hetzelfde woord denkt als wij. Bij het
// sorteerspel kost een ander woord hooguit één fout antwoord; hier klopt het
// hele paar niet meer als hij 🐇 "haas" noemt in plaats van "konijn". Daarom
// staat er in het spel een rijmlijst waarin je per paar kunt aan- en uitzetten.
//
// `klank` is de rijmklank. Twee paren met dezelfde klank mogen nooit samen in
// één veld liggen: "tand/hand" en "mand/hand" zouden dan allebei kloppen, en
// dan is er geen goed antwoord meer. Het spel kiest daarom per veld hoogstens
// één paar per klank.
//
// standaard: false = staat uit bij de start, omdat een van de twee plaatjes
// ook een andere naam kan hebben.

export const rijmparen = [
  { klank: 'uis', links: { woord: 'muis', cp: '1f42d' }, rechts: { woord: 'huis', cp: '1f3e0' } },
  { klank: 'aan', links: { woord: 'haan', cp: '1f413' }, rechts: { woord: 'maan', cp: '1f319' } },
  { klank: 'at', links: { woord: 'kat', cp: '1f431' }, rechts: { woord: 'rat', cp: '1f400' } },
  { klank: 'eer', links: { woord: 'beer', cp: '1f43b' }, rechts: { woord: 'peer', cp: '1f350' } },
  { klank: 'ip', links: { woord: 'kip', cp: '1f414' }, rechts: { woord: 'schip', cp: '1f6a2' } },
  { klank: 'ond', links: { woord: 'hond', cp: '1f436' }, rechts: { woord: 'mond', cp: '1f444' } },
  { klank: 'oek', links: { woord: 'koek', cp: '1f36a' }, rechts: { woord: 'boek', cp: '1f4d6' } },
  { klank: 'aap', links: { woord: 'schaap', cp: '1f411' }, rechts: { woord: 'aap', cp: '1f412' } },
  { klank: 'and', links: { woord: 'tand', cp: '1f9b7' }, rechts: { woord: 'hand', cp: '270b' } },
  { klank: 'and', links: { woord: 'mand', cp: '1f9fa' }, rechts: { woord: 'hand', cp: '270b' } },
  { klank: 'oet', links: { woord: 'hoed', cp: '1f452' }, rechts: { woord: 'voet', cp: '1f9b6' } },
  { klank: 'ein', links: { woord: 'trein', cp: '1f682' }, rechts: { woord: 'konijn', cp: '1f430' } },
  { klank: 'il', links: { woord: 'bril', cp: '1f453' }, rechts: { woord: 'pil', cp: '1f48a' } },
  { klank: 'aart', links: { woord: 'taart', cp: '1f370' }, rechts: { woord: 'kaart', cp: '1f5fa' } },
  { klank: 'ei', links: { woord: 'ei', cp: '1f95a' }, rechts: { woord: 'bij', cp: '1f41d' } },
  { klank: 'as', links: { woord: 'tas', cp: '1f45c' }, rechts: { woord: 'jas', cp: '1f9e5' } },
  { klank: 'oot', links: { woord: 'noot', cp: '1f95c' }, rechts: { woord: 'boot', cp: '1f6a4' } },
  { klank: 'aas', links: { woord: 'kaas', cp: '1f9c0' }, rechts: { woord: 'haas', cp: '1f407' }, standaard: false },

  // 🧱 is eerder een "steen", ⏰ een "wekker", 🫘 "bonen", 🐾 "pootjes",
  // 🕊️ "vogel", 📦 "pakje", 🫙 "pot of jampot", 🧴 "flesje zeep".
  { klank: 'uur', links: { woord: 'muur', cp: '1f9f1' }, rechts: { woord: 'vuur', cp: '1f525' }, standaard: false },
  { klank: 'ok', links: { woord: 'sok', cp: '1f9e6' }, rechts: { woord: 'klok', cp: '23f0' }, standaard: false },
  { klank: 'oon', links: { woord: 'kroon', cp: '1f451' }, rechts: { woord: 'boon', cp: '1fad8' }, standaard: false },
  { klank: 'oot', links: { woord: 'boot', cp: '1f6a4' }, rechts: { woord: 'poot', cp: '1f43e' }, standaard: false },
  { klank: 'uif', links: { woord: 'druif', cp: '1f347' }, rechts: { woord: 'duif', cp: '1f54a' }, standaard: false },
  { klank: 'oos', links: { woord: 'roos', cp: '1f339' }, rechts: { woord: 'doos', cp: '1f4e6' }, standaard: false },
  { klank: 'ot', links: { woord: 'bot', cp: '1f9b4' }, rechts: { woord: 'pot', cp: '1fad5' }, standaard: false },
  { klank: 'es', links: { woord: 'mes', cp: '1f52a' }, rechts: { woord: 'fles', cp: '1f9f4' }, standaard: false },
];

/** Alle codepoints die de rijmparen nodig hebben (voor de download-tool). */
export function rijmCodepoints() {
  return rijmparen.flatMap((paar) => [paar.links.cp, paar.rechts.cp]);
}

/** Staat dit paar standaard aan? (ontbrekende vlag = ja) */
export function paarStandaardAan(paar) {
  return paar.standaard !== false;
}

/** Een paar heeft geen eigen id-veld; de twee woorden samen zijn uniek genoeg. */
export function paarId(paar) {
  return `${paar.links.woord}-${paar.rechts.woord}`;
}

/**
 * Kiest paren die niet met elkáár rijmen.
 *
 * Zonder deze filter kun je "tand/hand" en "mand/hand" in hetzelfde veld
 * krijgen: twee opdrachten met hetzelfde antwoord, en dus één die per definitie
 * fout gaat. Dat is geen moeilijkheid maar een kapot veld.
 */
export function kiesParenZonderKruisrijm(beschikbaar, aantal) {
  const gebruikteKlanken = new Set();
  const gekozen = [];
  for (const paar of beschikbaar) {
    if (gekozen.length >= aantal) break;
    if (gebruikteKlanken.has(paar.klank)) continue;
    gebruikteKlanken.add(paar.klank);
    gekozen.push(paar);
  }
  return gekozen;
}
