// Woordbouwer: er staat een plaatje, en daaronder de letters van het woord door
// elkaar — plus een paar letters die er niet in horen. Tik of typ ze in de goede
// volgorde en het ei gaat open.
//
// Geen tijdsdruk, geen straf. Een verkeerde letter schudt en blijft gewoon
// liggen. Wie vastloopt krijgt na een paar pogingen de goede letter aangewezen:
// het enige wat hier echt mis kan gaan is dat hij niet verder komt.
//
// Het wordt vanzelf moeilijker naarmate hij meer dino's heeft uitgebroed. Zijn
// verzameling is dus tegelijk de beloning en de voortgangsmeter.

import { maakOpslag } from '../../js/core/storage.js';
import { toonLaag, registreerServiceWorker } from '../../js/core/ui.js';
import { vanWortel } from '../../js/core/pad.js';
import {
  spelwoorden,
  woordStandaardAan,
  woordenMetLengte,
  LENGTES,
} from '../../js/data/spelwoorden.js';
import {
  verdienDino,
  leesVerzameling,
  vulDinolijst,
  tintFilter,
} from '../../js/core/verzameling.js';
import { EI_CP } from '../../js/data/dinos.js';
import { maakParade } from './parade.js';
import {
  HINT_NA,
  WOORDEN_PER_DINO,
  STANDAARD_LENGTE,
  PARADE,
  VERWARREND,
  ALFABET,
  niveauVoor,
} from './config.js';

const el = {
  spel: document.getElementById('spel'),
  midden: document.getElementById('midden'),
  parade: document.getElementById('parade'),
  ei: document.getElementById('ei'),
  dino: document.getElementById('dino'),
  plaatje: document.getElementById('plaatje'),
  vakjes: document.getElementById('vakjes'),
  letters: document.getElementById('letters'),
  pauzeknop: document.getElementById('pauzeknop'),
  lengtes: document.getElementById('lengtes'),
  spelen: document.getElementById('spelen'),
  geenWoorden: document.getElementById('geen-woorden'),
  voortgang: document.getElementById('voortgang'),
  uitleg: document.getElementById('uitleg'),
  dinoknop: document.getElementById('dinoknop'),
  dinolijst: document.getElementById('dinolijst'),
  dinoregel: document.getElementById('dinoregel'),
  dinosKlaar: document.getElementById('dinos-klaar'),
  woordenknop: document.getElementById('woordenknop'),
  woordenlijst: document.getElementById('woordenlijst'),
  woordenKlaar: document.getElementById('woorden-klaar'),
  eipips: document.getElementById('eipips'),
};

const lagen = {
  start: document.getElementById('laag-start'),
  dinos: document.getElementById('laag-dinos'),
  woorden: document.getElementById('laag-woorden'),
};

const opslag = maakOpslag('bouw');

const spel = {
  lengte: opslag.lees('lengte', STANDAARD_LENGTE), // 'auto' of 3/4/5
  woord: null,
  recent: [], // laatst getoonde woorden, om herhaling te vermijden
  gezet: 0,
  misgrepen: 0,
  bezig: false,
};

const plaatjePad = (cp) => vanWortel(`assets/img/${cp}.svg`);
const woordAan = (w) => opslag.lees(`woord:${w.woord}`, woordStandaardAan(w));

function husselen(lijst) {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

// --- moeilijkheid ---------------------------------------------------------

// Alleen de woorden die híer goed gingen tellen mee voor de moeilijkheid; de
// verzameling zelf wordt over alle spellen heen gevuld.
const aantalGoed = () => opslag.lees('goed', 0);
const huidigNiveau = () => niveauVoor(aantalGoed());

/** Welke woordlengtes doen nu mee? */
function actieveLengtes() {
  return spel.lengte === 'auto' ? huidigNiveau().lengtes : [spel.lengte];
}

function beschikbaar() {
  return actieveLengtes().flatMap((l) => woordenMetLengte(l).filter(woordAan));
}

/**
 * Letters die niet in het woord horen.
 *
 * Bij voorkeur letters die lijken op een letter die er wél in zit: bij "bus" is
 * een d een veel nuttigere afleider dan een willekeurige x, want dat is precies
 * de verwarring die we oefenen.
 */
function kiesAfleiders(woord, aantal) {
  const inWoord = new Set(woord);
  const gekozen = [];

  const kandidaten = husselen([...woord])
    .flatMap((letter) => VERWARREND[letter] ?? [])
    .filter((l) => !inWoord.has(l));

  for (const letter of kandidaten) {
    if (gekozen.length >= aantal) break;
    if (!gekozen.includes(letter)) gekozen.push(letter);
  }

  // nog niet genoeg? aanvullen met willekeurige letters
  for (const letter of husselen(ALFABET)) {
    if (gekozen.length >= aantal) break;
    if (!inWoord.has(letter) && !gekozen.includes(letter)) gekozen.push(letter);
  }
  return gekozen;
}

// --- een woord klaarzetten ------------------------------------------------

// Hoeveel woorden we onthouden om niet te herhalen. Nooit meer dan de helft van
// wat er te kiezen valt, anders blijft er niets over: bij drie beschikbare
// woorden kun je er geen acht uitsluiten.
const MAX_GEHEUGEN = 8;

function nieuwWoord() {
  const pool = beschikbaar();
  if (pool.length === 0) return;

  // Alleen het vórige woord overslaan is te weinig: met twintig woorden kwam
  // hetzelfde plaatje nog steeds om de haverklap terug.
  const geheugen = Math.min(MAX_GEHEUGEN, Math.max(1, Math.floor(pool.length / 2)));
  spel.recent = spel.recent.slice(-geheugen);

  const vers = pool.filter((w) => !spel.recent.includes(w.woord));
  const kiesUit = vers.length > 0 ? vers : pool.filter((w) => w.woord !== spel.woord?.woord);
  const keuze = (kiesUit.length > 0 ? kiesUit : pool)[
    Math.floor(Math.random() * (kiesUit.length > 0 ? kiesUit.length : pool.length))
  ];

  spel.recent.push(keuze.woord);
  spel.woord = keuze;
  spel.gezet = 0;
  spel.misgrepen = 0;

  el.plaatje.src = plaatjePad(keuze.cp);
  el.ei.src = plaatjePad(EI_CP);
  el.ei.hidden = false;
  el.ei.className = 'bouw__eiplaatje';
  el.dino.hidden = true;

  bouwVakjes();
  bouwLetters();
  werkPipsBij();
}

function bouwVakjes() {
  el.vakjes.replaceChildren();
  for (const letter of spel.woord.woord) {
    const vak = document.createElement('span');
    vak.className = 'vakje';
    vak.dataset.letter = letter;
    el.vakjes.append(vak);
  }
}

function bouwLetters() {
  el.letters.replaceChildren();
  const afleiders = kiesAfleiders(spel.woord.woord, huidigNiveau().afleiders);
  for (const letter of husselen([...spel.woord.woord, ...afleiders])) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'letter';
    knop.textContent = letter;
    knop.addEventListener('click', () => probeer(letter, knop));
    el.letters.append(knop);
  }
}

// --- spelen ---------------------------------------------------------------

/** De eerstvolgende nog niet gebruikte tegel met deze letter. */
function vrijeTegel(letter) {
  return [...el.letters.children].find(
    (k) => k.textContent === letter && !k.classList.contains('letter--op')
  );
}

function probeer(letter, tegel) {
  if (!spel.bezig || !spel.woord || spel.gezet >= spel.woord.woord.length) return;

  const gezocht = spel.woord.woord[spel.gezet];
  const knop = tegel && !tegel.classList.contains('letter--op') ? tegel : vrijeTegel(letter);
  if (!knop) return;

  if (letter !== gezocht) {
    schud(knop);
    spel.misgrepen += 1;
    if (spel.misgrepen >= HINT_NA) wijsAan(gezocht);
    return;
  }

  knop.classList.add('letter--op');
  const vak = el.vakjes.children[spel.gezet];
  vak.textContent = letter;
  vak.classList.add('vakje--vol');
  spel.gezet += 1;
  spel.misgrepen = 0;
  for (const k of el.letters.children) k.classList.remove('letter--hint');

  // Het ei barst stukje bij beetje verder open; hij ziet dus dat hij vordert.
  el.ei.classList.add(`bouw__eiplaatje--stap${Math.min(spel.gezet, 5)}`);

  if (spel.gezet === spel.woord.woord.length) gelukt();
}

function schud(knop) {
  knop.classList.remove('letter--mis');
  void knop.offsetWidth; // animatie opnieuw laten starten
  knop.classList.add('letter--mis');
}

function wijsAan(letter) {
  const knop = vrijeTegel(letter);
  if (knop) knop.classList.add('letter--hint');
}

function gelukt() {
  spel.bezig = false;
  const goed = aantalGoed() + 1;
  opslag.schrijf('goed', goed);
  werkPipsBij(goed);

  // Niet elk woord levert een dino op: er zitten er meerdere in een ei.
  const komtUit = goed % WOORDEN_PER_DINO === 0;
  const dino = komtUit ? verdienDino() : null;

  if (komtUit) {
    el.ei.hidden = true;
    el.dino.src = plaatjePad(dino.soort.cp);
    el.dino.style.filter = tintFilter(dino.tint);
    el.dino.hidden = false;
    el.dino.classList.remove('bouw__dino--uit');
    void el.dino.offsetWidth;
    el.dino.classList.add('bouw__dino--uit');
  } else {
    // Nog niet uit, maar het ei schudt wel: er zit duidelijk iets in.
    el.ei.classList.remove('bouw__eiplaatje--wiebel');
    void el.ei.offsetWidth;
    el.ei.classList.add('bouw__eiplaatje--wiebel');
  }

  // Even van het beestje genieten, dan loopt hij de kudde in en komt het
  // volgende woord. Zonder dino hoeft die pauze niet zo lang.
  setTimeout(
    () => {
      if (!lagen.start.hidden || !lagen.dinos.hidden || !lagen.woorden.hidden) return;
      if (dino) {
        parade.voegToe({
          cp: dino.soort.cp,
          filter: tintFilter(dino.tint),
          bron: plaatjePad(dino.soort.cp),
        });
      }
      spel.bezig = true;
      nieuwWoord();
    },
    komtUit ? 1800 : 750
  );
}

/** De stipjes onder het ei: hoeveel woorden zitten er al in? */
function werkPipsBij(goed = aantalGoed()) {
  const gedaan = goed % WOORDEN_PER_DINO;
  el.eipips.replaceChildren();
  for (let i = 0; i < WOORDEN_PER_DINO; i++) {
    const pip = document.createElement('span');
    pip.className = i < gedaan ? 'eipip eipip--vol' : 'eipip';
    el.eipips.append(pip);
  }
}

// --- de rondlopende kudde -------------------------------------------------

// Het speelveld zelf is verboden gebied voor de kudde, anders lopen ze dwars
// door de letters heen.
const parade = maakParade(el.parade, () => {
  if (el.spel.hidden) return null;
  const vak = el.midden.getBoundingClientRect();
  const lucht = 16;
  return {
    left: vak.left - lucht,
    right: vak.right + lucht,
    top: vak.top - lucht,
    bottom: vak.bottom + lucht,
  };
});

function vulParade() {
  parade.leegmaken();
  const sleutels = Object.keys(leesVerzameling()).slice(-PARADE.maximum);
  for (const sleutel of sleutels) {
    const [cp, tint] = sleutel.split('|');
    parade.voegToe({ cp, filter: tintFilter(tint), bron: plaatjePad(cp) });
  }
}

// --- schermen -------------------------------------------------------------

function werkStartschermBij() {
  const genoeg = beschikbaar().length > 0;
  el.spelen.disabled = !genoeg;
  el.geenWoorden.hidden = genoeg;

  const goed = aantalGoed();
  const niveau = huidigNiveau();
  const lengtes = niveau.lengtes.join(' en ');
  const extra =
    niveau.afleiders > 0
      ? `, met ${niveau.afleiders} letter${niveau.afleiders === 1 ? '' : 's'} te veel`
      : '';

  // "vanzelf" zegt op zichzelf niets; hier staat wat het spel nú doet.
  el.uitleg.textContent =
    spel.lengte === 'auto'
      ? `Vanzelf = het spel kiest de lengte en wordt langzaam moeilijker. Nu: woorden van ${lengtes} letters${extra}.`
      : `Altijd woorden van ${spel.lengte} letters${extra}.`;

  el.voortgang.textContent =
    goed === 0
      ? 'Nog geen woord gebouwd'
      : `${goed} ${goed === 1 ? 'woord' : 'woorden'} goed · elke ${WOORDEN_PER_DINO} woorden komt er een dino uit het ei`;
}

function bouwLengtes() {
  el.lengtes.replaceChildren();
  for (const optie of ['auto', ...LENGTES]) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'paar';
    knop.textContent = optie === 'auto' ? 'vanzelf' : String(optie);
    if (optie === 'auto') knop.classList.add('paar--woord');
    knop.setAttribute('aria-pressed', String(optie === spel.lengte));
    knop.addEventListener('click', () => {
      spel.lengte = optie;
      opslag.schrijf('lengte', optie);
      bouwLengtes();
      werkStartschermBij();
    });
    el.lengtes.append(knop);
  }
}

function bouwDinolijst() {
  vulDinolijst(el.dinolijst, el.dinoregel, plaatjePad);
}

function bouwWoordenlijst() {
  el.woordenlijst.replaceChildren();
  for (const woord of spelwoorden) {
    const item = document.createElement('li');
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'woord';
    knop.setAttribute('aria-pressed', String(woordAan(woord)));

    const img = document.createElement('img');
    img.src = plaatjePad(woord.cp);
    img.alt = '';
    const naam = document.createElement('span');
    naam.className = 'woord__naam';
    naam.textContent = woord.woord;

    knop.append(img, naam);
    knop.addEventListener('click', () => {
      const nieuw = !woordAan(woord);
      opslag.schrijf(`woord:${woord.woord}`, nieuw);
      knop.setAttribute('aria-pressed', String(nieuw));
      werkStartschermBij();
    });
    item.append(knop);
    el.woordenlijst.append(item);
  }
}

function startSpel() {
  if (beschikbaar().length === 0) return;
  spel.bezig = true;
  spel.woord = null;
  spel.recent = [];
  toonLaag(lagen, null);
  el.spel.hidden = false;
  el.pauzeknop.hidden = false;
  nieuwWoord();
  vulParade();
  parade.start();
}

function naarStart() {
  spel.bezig = false;
  el.spel.hidden = true;
  el.pauzeknop.hidden = true;
  parade.stop();
  parade.leegmaken();
  bouwLengtes();
  werkStartschermBij();
  toonLaag(lagen, 'start');
}

el.spelen.addEventListener('click', startSpel);
el.pauzeknop.addEventListener('click', naarStart);
el.dinoknop.addEventListener('click', () => {
  bouwDinolijst();
  toonLaag(lagen, 'dinos');
});
el.dinosKlaar.addEventListener('click', () => toonLaag(lagen, 'start'));
el.woordenknop.addEventListener('click', () => {
  bouwWoordenlijst();
  toonLaag(lagen, 'woorden');
});
el.woordenKlaar.addEventListener('click', () => {
  werkStartschermBij();
  toonLaag(lagen, 'start');
});

// Typen mag ook: hij kent zijn letters, en een toets zoeken op het toetsenbord
// is zelf al goede oefening.
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    naarStart();
    return;
  }
  if (!spel.bezig || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (!/^[a-z]$/i.test(ev.key)) return;
  probeer(ev.key.toLowerCase(), null);
});

// De kudde stilzetten als je wegklikt; anders loopt hij voor niets te rekenen.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) parade.stop();
  else if (!el.spel.hidden) parade.start();
});

registreerServiceWorker();
bouwLengtes();
werkStartschermBij();

// Testhaak, net als bij het rijmspel: met ?test kan een script het spel nakijken.
if (new URLSearchParams(location.search).has('test')) {
  window.__bouw = {
    spel,
    startSpel,
    probeer,
    opslag,
    beschikbaar,
    huidigNiveau,
    aantalGoed,
    kiesAfleiders,
    parade,
  };
}
