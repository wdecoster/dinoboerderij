# Dinoboerderij

Nederlandse leesspelletjes voor kinderen met dyslexie.

Vier spellen die elk een ander stukje van leren lezen oefenen, met één beloning
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
- **Monsters komen alleen op je af als je iets draagt.** Met lege handen
  slenteren ze wat rond, dus je kunt rustig rondkijken en nadenken; het gevaar
  begint pas als je op weg bent.
- Op het startscherm kun je ze ook **helemaal uitzetten**. Rijmen is op zichzelf
  al genoeg, en wie nog met de pijltjes worstelt heeft er niets bij nodig.

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
tot zeven letters met drie afleiders (`kikker`, `olifant`, `paraplu`). Je kunt de
lengte ook vastzetten op 3 t/m 7. Op het startscherm staat in gewone taal wat er
op dat moment geldt.

Alleen klankzuivere woorden — die je schrijft zoals je ze zegt.

### Dino's voeren — van letters naar betekenis

Een van je eigen dino's verschijnt met een denkwolkje waar een woord in staat.
Op de plank liggen een paar dingen; geef het goede en hij eet het op.

Dit is het enige spel waarin een woord echt gelézen moet worden. De Woordbouwer
gaat van klank naar letters; dit gaat de andere kant op, en dat is wat lezen
uiteindelijk is.

De moeilijkheid zit niet in het woord maar in de afleiders, en die lopen mee met
wat hij kan:

| Niveau | De andere dingen | Wat je moet doen |
|---|---|---|
| begin | `kat` naast `boom` en `vis` | de eerste letter herkennen |
| midden | `kat` naast `kip` en `koe` | verder lezen dan de eerste letter |
| later | `boom` naast `boot` en `boek` | het woord tot het eind uitlezen |

Zo begint het bij wat hij al kan en eindigt het bij `oog`/`oor`, `hand`/`mand`,
`bed`/`bel`. Fout kost niets: het ding wiebelt en blijft liggen. Elke vijf keer
goed komt er een dino bij.

Werkt met tikken, dus ook op een tablet.

## De dino's

Alle drie de spellen vullen dezelfde kudde:

| Spel | Wanneer |
|---|---|
| Sorteren | elke vijf goede antwoorden |
| Rijmen | een veld helemaal uitspelen |
| Woordbouwer | elke drie woorden die af komen |
| Dino's voeren | elke vijf keer goed |

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

Onderaan het lijstscherm staat **alle dino's wissen**. Dat is een knop voor de
ouder — na een tijdje uitproberen staat de wei vol — dus hij staat bewust niet
op de wei zelf, is rood en stil in plaats van groot, en er komt eerst een scherm
overheen dat vraagt of je het zeker weet. Daar kun je kiezen:

| Keuze | Wat er weggaat |
|---|---|
| Alleen de dino's wissen | de kudde |
| Ook opnieuw beginnen met de spellen | de kudde, plus de moeilijkheid van de Woordbouwer, de snelheidsniveaus en topscores van Sorteren en de beste tijden van Rijmen |

Wat in beide gevallen blijft staan is alles wat jij hebt ingesteld: welke
plaatjes aan of uit staan, welk letterpaar, of de monsters meedoen. Dat is
handwerk dat je niet kwijt wilt raken omdat je de wei wilde opruimen. Wissen kan
niet ongedaan gemaakt worden.

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
| `woorden.js` | woorden per beginletter (Sorteren) | 361 |
| `rijmparen.js` | rijmparen met hun rijmklank (Rijmen) | 26 |
| `spelwoorden.js` | klankzuivere woorden van 3–7 letters (Woordbouwer, Voeren) | 141 |
| `dinos.js` | de soorten en kleuren om te verzamelen | 9 × 8 |
| `iconen.js` | de plaatjes op de knoppen | 11 |

Rijmparen hebben een veld `klank`. Twee paren met dezelfde klank mogen nooit
samen in één veld liggen — "tand/hand" en "mand/hand" zouden dan allebei kloppen
en dan is er geen goed antwoord meer. Het spel kiest daarom hoogstens één paar
per klank.

De lijst is opgebouwd met de **Nederlandse CLDR-namen** van Unicode: die geven
voor elke emoji een officiële Nederlandse naam, dus de woorden zijn nagekeken in
plaats van uit het hoofd opgeschreven. In de bruikbare categorieën (dieren,
eten, voorwerpen, plekken, activiteiten) zit nog ruimte voor uitbreiding; wat er
niet in kwam is wat een kind niet eenduidig benoemt.

Herhaling is niet alleen een kwestie van aantallen. Alle vier de spellen houden
bij wat er al langskwam en geven het minst geziene voorrang, zodat eerst de hele
bank aan de beurt komt voordat er iets terugkeert. Puur willekeurig trekken
voelt bij dagelijks spelen veel herhaliger dan het is.

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
games/voeren/           een woord lezen en het goede ding geven
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

- `games/rijm/?test`, `games/bouw/?test`, `games/voeren/?test` en
  `boerderij/?test` zetten hun staat op `window.__rijm`, `window.__bouw`,
  `window.__voeren` en `window.__boerderij`, zodat je van
  buitenaf kunt nakijken of oppakken, rijmen, afleiders en de rondlopende kudde
  doen wat ze moeten doen. Zonder die parameter gebeurt er niets.
- De niveaugenerator van Rijmen (`games/rijm/veld.js`) garandeert dat elk veld
  uit te spelen is: elk voorwerp bereikbaar, niets in een berg. Dat is de
  belangrijkste eigenschap van het hele project — een onspeelbaar veld is voor
  een kind niet "moeilijk" maar kapot.

## Licentie

Code: MIT, zie `LICENSE`. Plaatjes: Twemoji onder CC-BY 4.0, zie `CREDITS.md`.
