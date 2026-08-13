// "Je hebt een dino verdiend!" — het moment zelf.
//
// De dino's zijn de beloning van het hele project, maar in de meeste spellen
// gebeurde dat onzichtbaar: de stipjes liepen vol en waren dan opeens weer leeg.
// Je zag niet wát je gekregen had en niet dat het naar de boerderij ging.
//
// Daarom komt hij nu in beeld, laat zien wie hij is, en loopt dan het scherm
// uit — op weg naar de boerderij. Dat is voor een kind veel duidelijker dan een
// getal dat ergens omhoog gaat.
//
// Eén viering voor alle spellen, zodat het overal hetzelfde moment is. Hij
// vraagt niets: geen tik om weg te klikken, hij gaat vanzelf weer weg.

import { vanWortel } from './pad.js';
import { tintFilter } from './verzameling.js';

export const VIERTIJD = 2400; // milliseconden, tot en met het weglopen

/**
 * Laat de zojuist verdiende dino zien en daarna het scherm uit lopen.
 *
 * Geeft terug hoelang dat duurt, zodat een spel dat in de tijd loopt (zoals
 * Sorteren) zolang stil kan staan in plaats van door te razen.
 */
export function vierDino(dino) {
  const laag = document.createElement('div');
  laag.className = 'viering';
  laag.setAttribute('aria-hidden', 'true');

  // De loper verplaatst zich naar links; het beest erin wiebelt op en neer.
  // Twee lagen, want anders vechten de twee animaties om dezelfde transform.
  const loper = document.createElement('div');
  loper.className = 'viering__loper';

  const beest = document.createElement('img');
  beest.className = 'viering__beest';
  beest.alt = '';
  beest.style.filter = tintFilter(dino.tint);
  // Pas laten lopen als het plaatje er echt is: anders loopt op een traag
  // toestel een leeg vakje het scherm uit.
  beest.addEventListener('load', () => laag.classList.add('viering--klaar'), { once: true });
  beest.addEventListener('error', () => laag.classList.add('viering--klaar'), { once: true });
  beest.src = vanWortel(`assets/img/${dino.soort.cp}.svg`);

  const naam = document.createElement('p');
  naam.className = 'viering__naam';
  naam.textContent = `een ${dino.soort.naam}!`;

  const waarheen = document.createElement('p');
  waarheen.className = 'viering__waarheen';
  waarheen.textContent = 'loopt naar je boerderij';

  for (let i = 0; i < 8; i++) {
    const vonk = document.createElement('span');
    vonk.className = 'viering__vonk';
    vonk.style.setProperty('--hoek', `${i * 45}deg`);
    loper.append(vonk);
  }

  loper.append(beest);
  laag.append(loper, naam, waarheen);
  document.body.append(laag);

  return new Promise((klaar) => {
    let afgerond = false;
    const afronden = () => {
      if (afgerond) return;
      afgerond = true;
      laag.remove();
      klaar();
    };

    // Opruimen als het wéglopen klaar is, niet na een vaste tijd op de klok.
    // Op een trage tablet begint de animatie later dan de timer denkt, en dan
    // haalde die de dino weg voordat je hem goed en wel gezien had.
    loper.addEventListener('animationend', afronden);

    // Vangnet: geen animaties (uitgezet in de systeeminstellingen), of een
    // toestel dat zo druk is dat animationend nooit komt.
    const rustig = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(afronden, rustig ? VIERTIJD : VIERTIJD * 2);
  });
}
