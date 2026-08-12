# Dinoboerderij

Nederlandse leesspelletjes voor kinderen met dyslexie.

Drie spellen die elk een ander stukje van leren lezen oefenen, met één beloning
die ze aan elkaar knoopt: je verdient dino's voor je kudde. Draait in de browser,
dus op Linux, Windows en Android met dezelfde code. **Geen build-stap, geen
framework, geen dependencies.** Wat in de map staat, is de site.

## Uitgangspunten

Deze spellen zijn gemaakt voor een kind dat losse letters goed herkent, maar een
woord nog niet kan lezen. Dat stuurt bijna elke keuze:

- **Geen tekst en geen geluid tijdens het spelen.** Alleen plaatjes en letters.
  Wie niet kan lezen, hoeft niets te lezen om te kunnen spelen.
- **Grote vlakken, weinig keuzes.** Twee bakken, of een handvol lettertegels.
- **Je kunt niet echt verliezen.** Fouten kosten tijd of maken het drukker, maar
  ze zetten je nooit terug naar af. Vastlopen is het enige wat een kind afhaakt.
- **De letter draagt de betekenis, kleur is versiering.** Op kleur alleen kun je
  geen enkel spel spelen.
- **Elke knop heeft een plaatje.** Voor wie niet leest is het icoontje het echte
  label — het huisje ís "terug naar het menu". Zet ze in de HTML met
  `data-icoon="<codepoint>"`; `js/core/knoppen.js` hangt het plaatje ervoor.
- **Plaatjes zijn dubbelzinnig, en dat is het echte risico.** ⚽ is net zo goed
  "voetbal" als "bal"; 🕊️ is voor de meeste kinderen gewoon "vogel". Elk spel
  heeft daarom een lijst waarin je per plaatje aan- en uitzet wat het kind het
  wél zo noemt. Loop die één keer samen door voor je begint.

## Lokaal draaien

```sh
python3 -m http.server 8000
```

en open <http://localhost:8000>. Dat moet via `http://`: ES-modules en de service
worker werken niet als je `index.html` rechtstreeks opent met `file://`.

Tijdens het sleutelen cachet de service worker agressief — dat is zijn hele doel,
maar het betekent dat je een wijziging niet ziet. Zet in DevTools onder
**Application → Service Workers** de optie **Update on reload** aan, of gebruik
Ctrl+Shift+R.

## De spellen

### Sorteren — beginletters

Er valt een plaatje. Links of rechts, op grond van de eerste letter van het
Nederlandse woord. Fout of te laat: het blokje belandt op de stapel in het
midden, met de juiste letter er even bij. Raakt die stapel het plafond (acht
fouten), dan is het afgelopen. Omdat de stapel naar boven groeit, blijft er per
fout minder tijd over — dat is de enige straf.

Het tempo loopt op na drie keer goed en zakt na een fout, dus het blijft
winbaar. Te oefenen letterparen: **b/d, m/n, p/b, d/p, t/d, s/z**.

Bediening: tikken op de linker- of rechterhelft, of de pijltjestoetsen.

### Rijmen — rijmklanken horen

Een open veld. Links staan voorwerpen op kaartjes, rechts de kaartjes waar ze bij
horen: het ding dat erop rijmt. Loop ernaartoe, pak iets op, en breng het naar de
overkant. Ondertussen lopen er monsters rond die je proberen te tikken.

- Ga bij het goede kaartje **stilstaan** om af te leveren. Even stilstaan is
  nodig: anders zou langs de rij lópen al als een antwoord tellen.
- Fout? Je houdt het gewoon vast en probeert iets anders. Maar elke derde fout
  komt er een monster bij (maximaal vijf).
- Getikt worden kost niets blijvends: wat je droeg vliegt terug naar zijn plek en
  dat monster staat twee seconden stil.

Wat op een kaartje staat kun je pakken; wat op het gras staat (bergen, bomen,
rotsen) is een obstakel.

**Bediening: alleen de pijltjestoetsen.** Dit spel werkt dus niet op een telefoon
of tablet; de andere twee wel.

### Woordbouwer — van klank naar letter

Er staat een plaatje, en daaronder de letters van het woord door elkaar, plus een
paar letters die er niet in horen. Tik ze aan of typ ze in de goede volgorde en
er komt een dino uit het ei.

Dit is het enige spel waarin het kind een woord *maakt* in plaats van beoordeelt.
De afleiders zijn niet willekeurig: bij "bus" komt er een **d** of een **p** bij
te liggen, want dat is precies de verwarring die geoefend wordt.

Er zitten drie woorden in één ei: de stipjes eronder laten zien hoe ver het is.
Geen tijd, geen score. Een verkeerde letter schudt en blijft liggen; na drie
misgrepen gaat de goede letter wenken. Hetzelfde woord komt niet snel terug — het
spel onthoudt de laatste acht.

Met de knop **vanzelf** kiest het spel zelf de woordlengte en wordt het langzaam
moeilijker naarmate er meer woorden goed gaan: van drie letters zonder afleiders
tot vijf letters met drie afleiders. Je kunt de lengte ook vastzetten op 3, 4 of
5. Op het startscherm staat in gewone taal wat er op dat moment geldt.

Alleen klankzuivere woorden — die je schrijft zoals je ze zegt.

## De dino's

Alle drie de spellen vullen dezelfde kudde:

| Spel | Wanneer |
|---|---|
| Sorteren | elke vijf goede antwoorden |
| Rijmen | een veld helemaal uitspelen |
| Woordbouwer | elke drie woorden die af komen |

Negen soorten (langnek, t-rex, draak, drakenkop, hagedis, krokodil, schildpad,
mammoet, dodo) in acht kleuren, dus 72 verschillende beesten. De kleur wordt met
`hue-rotate` uit hetzelfde plaatje gedraaid en kost dus geen extra bestand. In de
Woordbouwer lopen de verdiende dino's rond naast het speelveld.

## De boerderij

`boerderij/` is geen spel maar de plek waar je ziet wat je hebt: alle verdiende
dino's lopen daar rond over de wei, achter een hek, langs een vijver. Tik er een
aan en hij zegt hoe hij heet. De knop **lijst** toont dezelfde kudde als
overzicht met namen en aantallen.

Er lopen er hoogstens veertig tegelijk in beeld; daarboven wordt het een
mierenhoop. De teller vertelt hoeveel je er in totaal hebt.

De verzameling staat in de browseropslag, per apparaat. De boerderij is
bereikbaar vanuit het menu en vanaf het startscherm van elk spel.

Dat de monsters in Rijmen géén dino's zijn, is met opzet: hetzelfde beestje kan
niet in het ene spel een prijs zijn en in het andere een gevaar. Een kind kijkt
naar het plaatje, niet naar de context.

## De woordenbank

`js/data/` is belangrijker dan alle spellogica bij elkaar: de spellen zijn maar
code, de woorden bepalen of ze werken. Een letterpaar met tien woorden is na vier
minuten op.

| Bestand | Inhoud | Omvang |
|---|---|---|
| `woorden.js` | woorden per beginletter (Sorteren) | 253 |
| `rijmparen.js` | rijmparen met hun rijmklank (Rijmen) | 26 |
| `spelwoorden.js` | klankzuivere woorden van 3–5 letters (Woordbouwer) | 85 |
| `dinos.js` | de soorten en kleuren om te verzamelen | 9 × 8 |
| `iconen.js` | de plaatjes op de knoppen | 11 |

Rijmparen hebben een veld `klank`. Twee paren met dezelfde klank mogen nooit
samen in één veld liggen — "tand/hand" en "mand/hand" zouden dan allebei kloppen
en dan is er geen goed antwoord meer. Het spel kiest daarom hoogstens één paar
per klank.

### Een woord toevoegen

1. Zoek het Twemoji-codepoint op: de bestandsnaam op
   <https://github.com/jdecked/twemoji/tree/main/assets/svg>.
2. Zet een regel bij in het juiste bestand in `js/data/`.
3. `node tools/haal-emoji.mjs` — haalt alleen op wat nog ontbreekt en werkt
   `assets/manifest.json` bij, dat de service worker gebruikt om alles offline te
   bewaren.
4. Hoog `VERSIE` in `sw.js` op, anders blijven bezoekers de oude versie zien.

## De "build"

Er is geen build-stap: de repo-inhoud ís de site. Wel zijn er twee scripts die je
één keer draait en waarvan je de uitvoer meecommit.

```sh
node tools/haal-emoji.mjs    # haalt de Twemoji-SVG's op naar assets/img/
node tools/maak-iconen.mjs   # tekent assets/icon-192.png en icon-512.png
```

`haal-emoji.mjs` verzamelt de codepoints uit alle databestanden, haalt op wat
ontbreekt, zet `width`/`height` in elke SVG (zonder eigen afmetingen tekent
Firefox een SVG niet betrouwbaar in een canvas) en schrijft `assets/manifest.json`
op het moment dat de bestanden binnenkomen, zodat die lijst niet uit de pas kan
lopen.

`maak-iconen.mjs` tekent de PWA-iconen met alleen `node:zlib` — er zit geen
SVG-converter in de keten.

## Publiceren

`.github/workflows/pages.yml` zet de map bij elke push naar `main` op GitHub
Pages. Eenmalig instellen: **Settings → Pages → Source: GitHub Actions**.

Op Android kun je de pagina via *Toevoegen aan startscherm* installeren; daarna
werkt hij offline.

## Structuur

```
index.html              het menu
boerderij/              de wei waar je dino's rondlopen
js/games.js             het register van spellen
js/data/                de woordenbanken en de dinosoorten
js/core/                gedeelde onderdelen (zie hieronder)
games/sorteer/          beginletters sorteren
games/rijm/             rijmen op een veld met monsters
games/bouw/             woorden bouwen uit letters
assets/img/             de plaatjes (Twemoji, zie CREDITS.md)
tools/                  eenmalige scripts
sw.js                   offline kunnen spelen
```

`js/core/` bevat wat alle spellen delen: `viewport.js` (schermmaat en
tekenassen), `loop.js` (vaste tijdstap), `input.js` (tikken en links/rechts),
`toetsen.js` (ingedrukte pijltjes), `storage.js` (onthouden), `plaatjes.js`
(plaatjes vooraf laden), `pad.js` (paden vanaf de site-root), `ui.js` (schermen),
`knoppen.js` (de icoontjes op de knoppen) en `verzameling.js` (de gedeelde
kudde).

## Een spel toevoegen

1. Nieuwe map onder `games/`, met een `index.html` en een `.js`.
2. Gebruik de onderdelen uit `js/core/`.
3. Eén regel erbij in `js/games.js`.
4. De nieuwe bestanden bij `SCHIL` in `sw.js`, en `VERSIE` ophogen.

## Testen

Er is geen testrunner; wel twee dingen die je los kunt draaien:

- `games/rijm/?test`, `games/bouw/?test` en `boerderij/?test` zetten hun staat op
  `window.__rijm`, `window.__bouw` en `window.__boerderij`, zodat je van
  buitenaf kunt nakijken of oppakken, rijmen, afleiders en de rondlopende kudde
  doen wat ze moeten doen. Zonder die parameter gebeurt er niets.
- De niveaugenerator van Rijmen (`games/rijm/veld.js`) garandeert dat elk veld
  uit te spelen is: elk voorwerp bereikbaar, niets in een berg. Dat is de
  belangrijkste eigenschap van het hele project — een onspeelbaar veld is voor
  een kind niet "moeilijk" maar kapot.

## Licentie

Code: MIT, zie `LICENSE`. Plaatjes: Twemoji onder CC-BY 4.0, zie `CREDITS.md`.
