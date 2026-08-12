// Plaatjes voor op de knoppen.
//
// Voor wie niet leest is het icoontje het echte label; het woord ernaast is er
// voor de ouder. Ze staan hier bij elkaar zodat tools/haal-emoji.mjs ze mee
// ophaalt en de service worker ze offline bewaart.
//
// In de HTML zet je ze met data-icoon="1f3e0"; js/core/knoppen.js hangt het
// plaatje er dan voor.

export const ICONEN = {
  menu: '1f3e0', // huis
  spelen: '25b6', // afspelen
  opnieuw: '1f504', // rondje
  pauze: '23f8',
  stoppen: '23f9',
  klaar: '2705', // vinkje
  dinos: '1f995', // langnek
  lijst: '1f4cb', // klembord
  letters: '1f524', // abc
  aantal: '1f522', // 1234
  boerderij: '1f3e1', // huis met tuin
  wissen: '1f5d1', // prullenbak
  waarschuwing: '26a0',
};

export function icoonCodepoints() {
  return Object.values(ICONEN);
}
