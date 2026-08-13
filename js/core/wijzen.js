// Aanwijzen met vinger of muis: waar wil je heen?
//
// Rijmen was alleen met de pijltjestoetsen te spelen en dus niet op een tablet.
// Deze module houdt bij waar er getikt is (en waar de vinger naartoe sleept),
// in coördinaten van het doek. Het spel rekent dat zelf om naar het speelveld,
// want alleen het spel weet hoe groot dat is.
//
// Bewust dom gehouden: geen route, geen spellogica. Net als toetsen.js levert
// het alleen "hier wil ik heen".

export function maakWijzer(doek) {
  let doel = null; // { x, y } in doekcoördinaten, of null
  let ingedrukt = false;

  function plaatsVan(ev) {
    const vak = doek.getBoundingClientRect();
    if (vak.width === 0 || vak.height === 0) return null;
    return {
      x: (ev.clientX - vak.left) / vak.width,
      y: (ev.clientY - vak.top) / vak.height,
    };
  }

  function omlaag(ev) {
    ev.preventDefault();
    ingedrukt = true;
    doel = plaatsVan(ev);
    doek.setPointerCapture?.(ev.pointerId);
  }

  function beweeg(ev) {
    // Slepen mag: dan verschuift het doel mee, zodat je hem kunt bijsturen.
    if (!ingedrukt) return;
    doel = plaatsVan(ev) ?? doel;
  }

  function omhoog(ev) {
    ingedrukt = false;
    doek.releasePointerCapture?.(ev.pointerId);
  }

  doek.addEventListener('pointerdown', omlaag);
  doek.addEventListener('pointermove', beweeg);
  doek.addEventListener('pointerup', omhoog);
  doek.addEventListener('pointercancel', omhoog);

  return {
    /** Waar wil hij heen? Null als er niets (meer) aangewezen is. */
    doel: () => doel,
    /** Doel bereikt of niet meer nodig. */
    wis() {
      doel = null;
    },
    stop() {
      doek.removeEventListener('pointerdown', omlaag);
      doek.removeEventListener('pointermove', beweeg);
      doek.removeEventListener('pointerup', omhoog);
      doek.removeEventListener('pointercancel', omhoog);
    },
  };
}
