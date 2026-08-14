# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Dinoboerderij** — five Dutch reading games for children with dyslexia, plus three
"places" where the dinosaurs they earn walk around. Static site, no build step, no
framework, no dependencies. Deployed to <https://wdecoster.github.io/dinoboerderij/>.

See `README.md` (in Dutch) for the pedagogy behind each game and the design principles.
Those principles are load-bearing — read them before changing game behaviour.

## Commands

```sh
python3 -m http.server 8000     # or: npm start — then open http://localhost:8000
node tools/haal-emoji.mjs       # fetch missing Twemoji SVGs + rewrite assets/manifest.json
node tools/maak-iconen.mjs      # regenerate assets/icon-192.png and icon-512.png
node --check <bestand>.js       # syntax check; there is no linter or test runner
```

Serving over `http://` is required — ES modules and the service worker do not work
from `file://`.

There is no test framework. Verification is done by driving the real pages in a
browser (see **Testing** below) and by ad-hoc Node scripts for DOM-free logic
(`games/rijm/veld.js` and the `js/data/` files import cleanly in Node).

## The two things that will bite you

**1. Bump `VERSIE` in `sw.js` whenever you add or change a file**, and add new
files to its `SCHIL` array. The service worker is cache-first; without a version
bump, users keep the old version indefinitely. `SCHIL` is hand-maintained for
code/pages; images are not listed there — they come from `assets/manifest.json`,
which `tools/haal-emoji.mjs` writes when it downloads them.

**2. While developing, the browser will serve you stale code.** Both the service
worker and the HTTP cache do this, and it looks exactly like "my change didn't
work". Use Ctrl+Shift+R, or DevTools → Application → Service Workers → *Update on
reload*. Half the confusing behaviour in this repo is stale cache.

## Architecture

**No build step: the repo contents *are* the site.** `.github/workflows/pages.yml`
uploads the directory as-is to GitHub Pages on push to `main`. Anything generated
(the 388 SVGs, the PWA icons) is generated once by a script and committed.

**Adding a game** = a folder under `games/`, one line in `js/games.js` (the hub
registry), entries in `sw.js` `SCHIL`, and a `VERSIE` bump. Nothing else knows
games exist.

**`js/core/` is what all games share.** The non-obvious contracts:

- `viewport.js` — canvas sizing. **The virtual height is always 100 units**; width
  follows the aspect ratio. Canvas games draw in these units. Resizing a canvas
  clears it, so set `viewport.opWijziging = teken` after init or the screen goes
  blank on rotate/resize while paused.
- `loop.js` — fixed 1/60s timestep. It deliberately knows nothing about tab
  visibility; **pausing on `visibilitychange` is each game's job** (they show a
  pause screen — a stopped loop with nothing on screen is a dead game).
- `pad.js` — `vanWortel()` resolves paths from the site root, derived from
  `import.meta.url`. **Always use it for asset/page URLs**: the site is served from
  a subpath (`/dinoboerderij/`) on Pages, and games live two directories deep.
- `verzameling.js` — the shared dino collection. Single source of truth for what
  the player has earned; all five games write to it.
- `plekscene.js` — one scene renderer for all three places. What differs (colours,
  decor, water, fence) is data in `js/data/plekken.js`, so a fourth place is data,
  not code.
- `input.js` (discrete left/right taps), `toetsen.js` (held arrow keys) and
  `wijzen.js` (tap/drag destination) are separate on purpose — each game picks its
  input model. All five games work on touch.

**Canvas games letterbox a fixed virtual field** into whatever canvas they get
(`rijm` and the places use 150×100). Do not assume the CSS gives an exact aspect
ratio; a mismatch used to push half the field off-screen.

## The data files are the actual product

`js/data/` matters more than the game logic — the games are a few hundred lines
each, but a letter pair with ten words is exhausted in four minutes.

| File | Used by | Size |
|---|---|---|
| `woorden.js` | Sorteren, Zoekplaat (grouped by first letter) | 361 |
| `spelwoorden.js` | Woordbouwer, Voeren (klankzuiver, 3–7 letters) | 141 |
| `rijmparen.js` | Rijmen (each pair has a `klank`) | 26 |
| `dinos.js`, `plekken.js`, `iconen.js` | rewards, places, button icons | 9 / 3 / 16 |
| `verwarrend.js` | confusable letters, for choosing distractors | — |

Every picture is a Twemoji codepoint. **Verify a codepoint exists before adding a
word** (`https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg/<cp>.svg`),
then run `node tools/haal-emoji.mjs`, which gathers codepoints from every data
file, downloads what is missing, **injects `width`/`height` into each SVG** (Firefox
will not reliably draw a dimensionless SVG into a canvas) and rewrites
`assets/manifest.json`. Never hand-copy an SVG into `assets/img/`.

Unicode CLDR ships official Dutch emoji names — useful for expanding the bank
without inventing words. Roughly 500 usable candidates remain unmined.

### Curation rules

These are the criteria the existing 361 words were picked by. They are not
enforced by code, so a plausible-looking addition can quietly break a game.

**The bar for any word: a 7-year-old names that picture, in Dutch, without
hesitating.** That is stricter than "the picture is recognisable". It rejected
*pikhouweel*, *veiligheidsvest* and *kassabon* — fine drawings, not words a child
reaches for.

**A CLDR name describes the emoji, not what it depicts in your context.** `1f9d1`
is officially "person", not "dokter"; `1fa91` is a chair, not a table. Look at the
picture before trusting the label.

**Ambiguity is the main failure mode**, and it is worse than a wrong answer —
the child is right and the game says no. ⚽ is "bal" or "voetbal"; 🕊️ is usually
just "vogel"; 📦 is often "pakje". Those get `standaard: false` (30 of 361 do)
and every game has a per-picture toggle list so the parent can switch them on
once they know what the child actually says.

**One picture, one word.** Two entries sharing a codepoint means the same drawing
has two right answers. The single existing case (⏰ = `klok` / `wekker`) is
defused by having `klok` default to off; keep it that way or drop one.

**`spelwoorden.js` is a filter over `woorden.js`, not a second list** (currently a
subset except `plant`). Two extra constraints apply there, because those games ask
the child to *spell* or *read* the word rather than name a picture:

- **Klankzuiver** — written as it sounds. This excludes `citroen` (c = /s/),
  `punaise` (French vowel), `hond` (sounds "hont"), `trein`, and loanwords like
  `printer` and `paperclip`. All of those are perfectly good in Sorteren, where
  only the first letter matters.
- **3–7 letters.** Seven plus three distractors is ten tiles, which wraps to two
  rows on a tablet — that is the practical ceiling.

**Near-identical words are a feature, not a collision.** `bad`/`bed`, `bom`/`bot`,
`oog`/`oor`, `hand`/`mand`/`tand` are what Voeren's hardest level (`lijkterop`)
and Woordbouwer's distractors are built on. When adding words, prefer ones that
create minimal pairs; there are 27 today.

**Rhyme pairs carry a `klank`** and a level never picks two pairs with the same
one — "tand/hand" plus "mand/hand" would give a puzzle with two right answers.

## Testing

Add `?test` to a page and it exposes its state: `window.__sorteer`, `__rijm`,
`__bouw`, `__voeren`, `__zoek`, `__plek`. Without the parameter nothing is exposed.

**`requestAnimationFrame` does not fire in a backgrounded tab**, which is what
browser automation gives you — so canvas games appear frozen. Drive them with a
manual frame pump:

```js
window.__w = null;
window.requestAnimationFrame = (cb) => { window.__w = cb; return 1; };
window.cancelAnimationFrame = () => { window.__w = null; };
window.__klok = performance.now();
const pomp = (n) => { for (let i = 0; i < n; i++) { const cb = window.__w; if (!cb) break;
  window.__w = null; window.__klok += 1000 / 60; cb(window.__klok); } };
```

Two traps: `lus.start()` early-returns if the loop is already running (stop it
first, or the pump never receives a callback), and **reset `window.__klok` to
`performance.now()` after every `start()`** — the loop computes `dt` against the
real clock, so a stale synthetic clock yields a negative `dt` and nothing moves.
Also override `document.hidden` to `false`, otherwise taking a screenshot
backgrounds the tab and the game pauses itself.

## Conventions

- **The code is Dutch** — identifiers, comments, commit messages and UI text.
  `speler`, `woord`, `kudde`, `viering`, `beschikbaar()`. Keep it that way; mixed
  English/Dutch identifiers read badly here.
- **No dependencies, no build tooling.** `package.json` exists for `"type": "module"`
  and three script aliases. Adding a bundler or a framework would defeat the point.
- Comments explain *why*, especially where a plain implementation was rejected for
  a reason specific to a child who cannot read yet. Preserve that reasoning.
- Player-facing state lives in `localStorage` under `leesspel:<ruimte>:<sleutel>`
  via `js/core/storage.js`. Namespaces: `dinos`, `sorteer`, `rijm`, `bouw`,
  `voeren`, `zoek`. The reset flow distinguishes **progress** (levels, high scores,
  `goed` counters) from **parent settings** (per-picture toggles, chosen letter
  pair) — never wipe the latter; it is hand-curated work.
- `leesspel:dinos:verzameling` has migrated twice: from `{ "cp|tint": count }` to
  an array of individuals, and then gaining an `id` per dino so a single animal
  can be renamed. Entries are `{ id, cp, tint, plek, naam? }` and
  `leesVerzameling()` converts both older shapes on read — keep those paths
  working.
- Naming a dino is the one place in the app with a free text field. That is
  deliberate: a name cannot be wrong, so spelling does not matter and nothing is
  at stake. Do not add free text where an answer can be judged.
