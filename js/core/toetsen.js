// Ingedrukte pijltjestoetsen bijhouden en omzetten naar één richting.
//
// Dit is bewust géén uitbreiding van input.js: dat vertaalt een tik of een
// toetsaanslag naar een losse keuze ('links' of 'rechts'), en dat past niet bij
// lopen, waarbij een toets ingedrukt blíjft.
//
// Het spel leest alleen `richting()`. Wil je later met tikken lopen, dan komt
// daar een andere module die hetzelfde teruggeeft — de spellogica hoeft dan
// niet te veranderen.

const TOETSEN = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

export function maakToetsen() {
  const ingedrukt = new Set();

  function omlaag(ev) {
    if (!TOETSEN[ev.key]) return;
    ev.preventDefault(); // anders scrollt de pagina onder het spel weg
    ingedrukt.add(ev.key);
  }

  function omhoog(ev) {
    if (!TOETSEN[ev.key]) return;
    ingedrukt.delete(ev.key);
  }

  // Wie het venster verlaat terwijl hij loopt, zou anders eeuwig door blijven
  // lopen: de keyup komt dan nooit aan.
  function vergeetAlles() {
    ingedrukt.clear();
  }

  window.addEventListener('keydown', omlaag);
  window.addEventListener('keyup', omhoog);
  window.addEventListener('blur', vergeetAlles);

  return {
    /** Genormaliseerde richting; {x:0,y:0} als er niets ingedrukt is. */
    richting() {
      let x = 0;
      let y = 0;
      for (const toets of ingedrukt) {
        x += TOETSEN[toets].x;
        y += TOETSEN[toets].y;
      }
      // Schuin lopen mag niet sneller zijn dan recht lopen.
      const lengte = Math.hypot(x, y);
      return lengte === 0 ? { x: 0, y: 0 } : { x: x / lengte, y: y / lengte };
    },
    vergeetAlles,
    stop() {
      window.removeEventListener('keydown', omlaag);
      window.removeEventListener('keyup', omhoog);
      window.removeEventListener('blur', vergeetAlles);
    },
  };
}
