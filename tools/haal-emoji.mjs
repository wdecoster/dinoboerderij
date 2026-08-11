// Haalt de Twemoji-SVG's op die de woordenbank noemt en zet ze in assets/img/.
// Eén keer draaien, daarna de SVG's meecommitten — de site heeft dit script
// nooit nodig en er is dus geen build-stap.
//
//   node tools/haal-emoji.mjs
//
// Schrijft ook assets/manifest.json: de lijst met plaatjes die de service
// worker precachet. Die lijst wordt hier geschreven op het moment dat de
// bestanden binnenkomen, zodat hij niet uit de pas kan lopen.

import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { woorden } from '../js/data/woorden.js';
import { rijmCodepoints } from '../js/data/rijmparen.js';
import { spelCodepoints } from '../games/rijm/config.js';
import { spelwoordCodepoints } from '../js/data/spelwoorden.js';
import { dinoCodepoints } from '../js/data/dinos.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = resolve(root, 'assets/img');
const BRON = 'https://raw.githubusercontent.com/jdecked/twemoji/main/assets/svg';

// Twemoji levert <svg viewBox="0 0 36 36"> zonder width/height. Firefox kan
// zo'n SVG zonder eigen afmetingen niet betrouwbaar in een canvas tekenen
// (drawImage levert dan niets op), dus we zetten ze er hier in.
function zetAfmetingen(svg) {
  if (/<svg[^>]*\swidth=/.test(svg)) return svg;
  const maat = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const [b, h] = maat ? [maat[1], maat[2]] : ['36', '36'];
  return svg.replace(/<svg\b/, `<svg width="${b}" height="${h}"`);
}

async function haal(cp) {
  const res = await fetch(`${BRON}/${cp}.svg`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rauw = await res.text();
  if (!rauw.includes('<svg')) throw new Error('geen SVG terug');
  const svg = zetAfmetingen(rauw);
  await writeFile(resolve(imgDir, `${cp}.svg`), svg);
  return svg.length;
}

// Elk spel levert zijn eigen codepoints aan; hier gooien we ze op één hoop.
const codepoints = [
  ...new Set([
    ...woorden.map((w) => w.cp),
    ...rijmCodepoints(),
    ...spelCodepoints(),
    ...spelwoordCodepoints(),
    ...dinoCodepoints(),
  ]),
];
await mkdir(imgDir, { recursive: true });

console.log(`${codepoints.length} plaatjes ophalen…`);
const mislukt = [];
let bytes = 0;

for (const cp of codepoints) {
  try {
    bytes += await haal(cp);
  } catch (err) {
    mislukt.push(`${cp}: ${err.message}`);
  }
}

if (mislukt.length) {
  console.error(`\n${mislukt.length} MISLUKT:`);
  for (const m of mislukt) console.error(`  ${m}`);
}

// manifest.json = alles wat er nu écht in assets/img/ staat
const bestanden = (await readdir(imgDir)).filter((f) => f.endsWith('.svg')).sort();
await writeFile(
  resolve(root, 'assets/manifest.json'),
  JSON.stringify({ plaatjes: bestanden.map((f) => `assets/img/${f}`) }, null, 2) + '\n'
);

console.log(
  `\nKlaar: ${codepoints.length - mislukt.length} opgehaald (${(bytes / 1024).toFixed(0)} kB), ` +
    `${bestanden.length} in assets/img/, manifest.json bijgewerkt.`
);
if (mislukt.length) process.exitCode = 1;
