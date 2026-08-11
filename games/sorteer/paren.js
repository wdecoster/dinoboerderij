// Welke letterparen kun je oefenen? Een paar toevoegen is één regel hier, mits
// er woorden met die beginletters in js/data/woorden.js staan.
//
// De linkerletter hoort altijd bij de linkerbak. De volgorde ligt vast en de
// bakken wisselen niet van plaats: wie voor het eerst een spel speelt, moet
// niet óók nog een bewegend doel bijhouden.

export const paren = [
  { id: 'bd', links: 'b', rechts: 'd' },
  { id: 'mn', links: 'm', rechts: 'n' },
  { id: 'pb', links: 'p', rechts: 'b' },
  { id: 'dp', links: 'd', rechts: 'p' },
  // t/d en s/z zijn geen spiegelletters maar klankverwarringen: "tand" of
  // "dant", "sok" of "zok". Nu de woordenbank groot genoeg is, kan dat ook.
  { id: 'td', links: 't', rechts: 'd' },
  { id: 'sz', links: 's', rechts: 'z' },
];

export const STANDAARD_PAAR = 'bd';

// De moeilijkheid zit in één getal: hoe snel het blokje valt. Er valt altijd
// maar één ding tegelijk — twee tegelijk is voor een beginner geen uitdaging
// maar chaos.
export const moeilijkheid = {
  begin: 1,
  max: 12,
  goedVoorOmhoog: 3, // drie keer goed op rij → een niveau erbij

  /**
   * Valsnelheid in eenheden per seconde (het speelveld is 100 hoog).
   * Niveau 1 ≈ 9 seconden per blokje, niveau 12 ≈ 3,5 seconde.
   *
   * Dit is de knop waar je aan draait als het te makkelijk of te moeilijk is.
   * Het eerste getal is het begintempo, het tweede hoeveel er per niveau bij komt.
   */
  snelheid(niveau) {
    return 10 + (niveau - 1) * 1.8;
  },
};
