// Schaalt het canvas naar het scherm en geeft een vast tekenassenstelsel.
//
// De hoogte is ALTIJD 100 virtuele eenheden; de breedte volgt uit de
// beeldverhouding. Zo hoeft geen enkel spel iets van pixels of van
// devicePixelRatio te weten, en werkt dezelfde code op een telefoon en op een
// laptop zonder zwarte balken.

// Zet na het aanmaken `viewport.opWijziging = teken` om bij elke maatverandering
// opnieuw te laten tekenen. Dat gebeurt niet in de aanroep hierboven, omdat het
// spel op dat moment nog niet klaar is om getekend te worden.
export function maakViewport(doek) {
  const ctx = doek.getContext('2d');
  const viewport = { ctx, doek, breedte: 100, hoogte: 100, opWijziging: null };

  function meet() {
    const vak = doek.getBoundingClientRect();
    if (vak.width === 0 || vak.height === 0) return;

    // dpr afkappen: op een telefoon met dpr 3+ kost een scherper doek meer dan
    // het oplevert voor grote vlakken en emoji.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    doek.width = Math.round(vak.width * dpr);
    doek.height = Math.round(vak.height * dpr);

    viewport.hoogte = 100;
    viewport.breedte = (vak.width / vak.height) * 100;

    const schaal = doek.height / viewport.hoogte; // device-pixels per eenheid
    ctx.setTransform(schaal, 0, 0, schaal, 0, 0);

    // Het doek een nieuwe maat geven wist het. Draait de lus, dan valt dat niet
    // op omdat het volgende frame er meteen overheen tekent — maar staat het
    // spel stil (pauze, startscherm), dan blijft er een leeg vlak achter.
    // Daarom hier opnieuw laten tekenen.
    viewport.opWijziging?.();
  }

  meet();

  const waarnemer = new ResizeObserver(meet);
  waarnemer.observe(doek);
  window.addEventListener('orientationchange', meet);

  viewport.meet = meet;
  viewport.stop = () => {
    waarnemer.disconnect();
    window.removeEventListener('orientationchange', meet);
  };
  return viewport;
}
