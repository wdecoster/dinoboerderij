// Speellus met een vaste tijdstap: de natuurkunde doet altijd stapjes van
// 1/60 seconde, ongeacht hoe snel het scherm ververst. Anders valt een blokje
// op een 144 Hz-scherm ruim twee keer zo snel als op een oude laptop.
//
// De lus weet niets van tabbladen die naar de achtergrond gaan: wát er dan moet
// gebeuren is een keuze van het spel (hier: pauzeren met een scherm erover),
// niet van de lus.

const STAP = 1 / 60;
const MAX_INHAAL = 0.25; // na een tabblad-wissel niet honderden stappen inhalen

export function maakLus(stap, teken) {
  let vorige = 0;
  let opgespaard = 0;
  let id = 0;
  let draait = false;

  function frame(nu) {
    if (!draait) return;
    id = requestAnimationFrame(frame);

    const dt = Math.min((nu - vorige) / 1000, MAX_INHAAL);
    vorige = nu;
    opgespaard += dt;

    while (opgespaard >= STAP) {
      stap(STAP);
      opgespaard -= STAP;
    }
    teken();
  }

  const lus = {
    start() {
      if (draait) return;
      draait = true;
      vorige = performance.now();
      opgespaard = 0;
      id = requestAnimationFrame(frame);
    },
    stop() {
      draait = false;
      cancelAnimationFrame(id);
    },
    get draait() {
      return draait;
    },
  };

  return lus;
}
