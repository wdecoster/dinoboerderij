// De uitgebroede dino's lopen rond in de ruimte naast het spel.
//
// Ze zijn de beloning, en een beloning die je alleen op een apart scherm kunt
// bekijken is halve winst: zo ziet hij zijn kudde de hele tijd, en komt er bij
// elk goed woord zichtbaar eentje bij.
//
// Ze blijven uit de buurt van het spel zelf: het speelveld wordt als verboden
// gebied doorgegeven en ze worden er zachtjes uit geduwd. Op een smal scherm is
// er links en rechts geen plek, en dan lopen ze er vanzelf boven en onder.

import { PARADE } from './config.js';

const willekeurig = (van, tot) => van + Math.random() * (tot - van);

export function maakParade(laag, vraagVerbodenVak) {
  const dinos = [];
  let id = 0;
  let draait = false;
  let vorige = 0;

  const rustig = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function zetNeer(dino) {
    dino.el.style.transform =
      `translate(${Math.round(dino.x)}px, ${Math.round(dino.y)}px)` +
      (dino.vx < 0 ? ' scaleX(-1)' : '');
  }

  /** Een plek buiten het speelveld zoeken om te beginnen. */
  function vrijePlek() {
    const vak = vraagVerbodenVak();
    const maxX = Math.max(0, window.innerWidth - PARADE.maat - PARADE.marge);
    const maxY = Math.max(0, window.innerHeight - PARADE.maat - PARADE.marge);
    for (let poging = 0; poging < 40; poging++) {
      const x = willekeurig(PARADE.marge, maxX);
      const y = willekeurig(PARADE.marge, maxY);
      if (!vak || !overlapt(x, y, vak)) return { x, y };
    }
    return { x: PARADE.marge, y: PARADE.marge };
  }

  function overlapt(x, y, vak) {
    return (
      x + PARADE.maat > vak.left &&
      x < vak.right &&
      y + PARADE.maat > vak.top &&
      y < vak.bottom
    );
  }

  function voegToe({ cp, filter, bron }) {
    if (dinos.length >= PARADE.maximum) {
      const oudste = dinos.shift();
      oudste.el.remove();
    }
    const img = document.createElement('img');
    img.src = bron;
    img.alt = '';
    img.className = 'parade__dino';
    img.style.filter = filter;
    laag.append(img);

    const hoek = willekeurig(0, Math.PI * 2);
    const snelheid = willekeurig(PARADE.snelheid[0], PARADE.snelheid[1]);
    const plek = vrijePlek();
    const dino = {
      el: img,
      cp,
      x: plek.x,
      y: plek.y,
      vx: Math.cos(hoek) * snelheid,
      vy: Math.sin(hoek) * snelheid,
    };
    dinos.push(dino);
    zetNeer(dino);
    return dino;
  }

  function stap(dt) {
    const vak = vraagVerbodenVak();
    const maxX = Math.max(0, window.innerWidth - PARADE.maat - PARADE.marge);
    const maxY = Math.max(0, window.innerHeight - PARADE.maat - PARADE.marge);

    for (const dino of dinos) {
      dino.x += dino.vx * dt;
      dino.y += dino.vy * dt;

      // van de schermranden af stuiteren
      if (dino.x < PARADE.marge) { dino.x = PARADE.marge; dino.vx = Math.abs(dino.vx); }
      if (dino.x > maxX) { dino.x = maxX; dino.vx = -Math.abs(dino.vx); }
      if (dino.y < PARADE.marge) { dino.y = PARADE.marge; dino.vy = Math.abs(dino.vy); }
      if (dino.y > maxY) { dino.y = maxY; dino.vy = -Math.abs(dino.vy); }

      // en uit het speelveld weg, langs de kortste kant
      if (vak && overlapt(dino.x, dino.y, vak)) {
        const naarLinks = dino.x + PARADE.maat - vak.left;
        const naarRechts = vak.right - dino.x;
        const naarBoven = dino.y + PARADE.maat - vak.top;
        const naarBeneden = vak.bottom - dino.y;
        const kleinste = Math.min(naarLinks, naarRechts, naarBoven, naarBeneden);

        if (kleinste === naarLinks && vak.left - PARADE.maat > PARADE.marge) {
          dino.x = vak.left - PARADE.maat;
          dino.vx = -Math.abs(dino.vx);
        } else if (kleinste === naarRechts && vak.right < maxX) {
          dino.x = vak.right;
          dino.vx = Math.abs(dino.vx);
        } else if (kleinste === naarBoven && vak.top - PARADE.maat > PARADE.marge) {
          dino.y = vak.top - PARADE.maat;
          dino.vy = -Math.abs(dino.vy);
        } else {
          dino.y = Math.min(vak.bottom, maxY);
          dino.vy = Math.abs(dino.vy);
        }
      }

      zetNeer(dino);
    }
  }

  function frame(nu) {
    if (!draait) return;
    id = requestAnimationFrame(frame);
    const dt = Math.min((nu - vorige) / 1000, 0.1);
    vorige = nu;
    stap(dt);
  }

  return {
    voegToe,
    aantal: () => dinos.length,
    leegmaken() {
      for (const dino of dinos) dino.el.remove();
      dinos.length = 0;
    },
    start() {
      if (draait || rustig) return; // stilstaande dino's bij reduced motion
      draait = true;
      vorige = performance.now();
      id = requestAnimationFrame(frame);
    },
    stop() {
      draait = false;
      cancelAnimationFrame(id);
    },
  };
}
