// Alle getallen en plaatjes van het rijmspel op één plek, zodat je aan het spel
// kunt draaien zonder door de spellogica te hoeven.
//
// Het veld is altijd 150 breed en 100 hoog in virtuele eenheden (zie
// js/core/viewport.js), ongeacht de schermgrootte.

export const VELD = {
  breedte: 150,
  hoogte: 100,
  rand: 4, // marge waar niemand doorheen kan
  kolomLinks: 9, // x van de rij voorwerpen links
  kolomRechts: 141, // x van de rij voorwerpen rechts
};

export const SPELER = {
  cp: '1f9d2', // kind
  straal: 3.6,
  snelheid: 34, // eenheden per seconde
  maat: 9,
};

export const MONSTER = {
  // Geen dino's meer. Die zijn in de Woordbouwer juist de beloning, en hetzelfde
  // beestje kan niet in het ene spel een prijs zijn en in het andere een gevaar —
  // een kind kijkt naar het plaatje, niet naar de context. Een spook of een robot
  // verzamel je nooit, dus die verwarring is er niet.
  //
  // Elk monster krijgt een eigen soort én kleur: vijf identieke monsters zijn op
  // het veld niet uit elkaar te houden.
  cps: ['1f47b', '1f47e', '1f916'], // spook, monster, robot
  tinten: [0, 40, 85, 140, 190, 240, 290, 320], // graden hue-rotate
  straal: 4,
  // Langzamer dan de speler (34), zodat wegkomen altijd kan. Met pijltjes sturen
  // is voor een beginner al werk genoeg; dit is de knop om aan te draaien als
  // het te spannend is.
  snelheid: 20,
  // Als je niets draagt slenteren ze wat rond in plaats van op je af te komen.
  wandelSnelheid: 11,
  maat: 10,
  bevriesTijd: 2, // seconden stilstand nadat hij je getikt heeft
  herberekenTijd: 0.3, // hoe vaak de route naar de speler opnieuw wordt bepaald
  maximum: 5, // meer monsters dan dit wordt onspeelbaar
};

// Obstakels. Bergen en bomen zijn puur decoratie met een muur eronder.
export const OBSTAKEL = {
  cps: ['26f0', '1faa8', '1f333', '1f335'], // berg, rots, boom, cactus
  maat: 12,
  minimum: 4,
  maximum: 6,
};

export const VOORWERP = {
  maat: 10,
  pakStraal: 6, // hoe dicht je erbij moet zijn om iets te kunnen doen
  // Hoelang je moet stilstaan voordat afleveren of wisselen telt. Zonder dit
  // levert langs de rechterkolom lópen al fouten op — en dus monsters — terwijl
  // hij alleen maar ergens naartoe wilde. Straf hoort bij een verkeerde keuze,
  // niet bij navigeren.
  stilTijd: 0.12,
};

// Hoeveel paren kan hij kiezen op het startscherm?
export const AANTALLEN = [3, 4, 5, 6];
export const STANDAARD_AANTAL = 3;

// Elke zoveelste fout komt er een monster bij.
export const FOUTEN_PER_MONSTER = 3;

// Staan de monsters aan? Uit te zetten op het startscherm: rijmen is op zichzelf
// al genoeg, en wie nog met de pijltjes worstelt heeft er niets bij nodig.
export const STANDAARD_MONSTERS = true;

/** Alle vaste codepoints van dit spel (voor tools/haal-emoji.mjs). */
export function spelCodepoints() {
  return [SPELER.cp, ...MONSTER.cps, ...OBSTAKEL.cps];
}
