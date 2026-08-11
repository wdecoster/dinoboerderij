// Maakt de PWA-iconen (assets/icon-192.png en icon-512.png).
// Er staat geen SVG-converter op deze machine, dus we tekenen de letters b en d
// zelf als pixels en schrijven de PNG met alleen node:zlib. Geen dependencies.
//
//   node tools/maak-iconen.mjs
//
// Eén keer draaien en de PNG's meecommitten.

import { deflateSync } from 'node:zlib';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ACHTERGROND = [0xfd, 0xf6, 0xe3]; // crème
const BLAUW = [0x2f, 0x80, 0xed]; // b
const ORANJE = [0xe8, 0x7a, 0x1e]; // d

// --- PNG-schrijver ---------------------------------------------------------

const crcTabel = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTabel[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTabel[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const lengte = Buffer.alloc(4);
  lengte.writeUInt32BE(data.length);
  const romp = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(romp));
  return Buffer.concat([lengte, romp, crc]);
}

/** pixels = Buffer met breedte*hoogte*3 bytes RGB. */
function png(pixels, breedte, hoogte) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breedte, 0);
  ihdr.writeUInt32BE(hoogte, 4);
  ihdr[8] = 8; // bits per kanaal
  ihdr[9] = 2; // kleurtype 2 = RGB
  // 10..12 = compressie/filter/interlace, allemaal 0

  // elke scanline krijgt een filter-byte 0 (None) ervoor
  const rauw = Buffer.alloc(hoogte * (1 + breedte * 3));
  for (let y = 0; y < hoogte; y++) {
    const van = y * breedte * 3;
    pixels.copy(rauw, y * (1 + breedte * 3) + 1, van, van + breedte * 3);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rauw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- letters tekenen -------------------------------------------------------

// Een 'b' is een verticale stok met een ring rechtsonder; een 'd' is het
// spiegelbeeld. Precies de vergissing die het spel oefent, dus een passend icoon.
function maaktDeelUit(px, py, vak, spiegel) {
  const { x, y, b, h } = vak;
  const lx = spiegel ? x + b - (px - x) : px; // spiegel horizontaal voor de 'd'

  const stokBreedte = b * 0.2;
  const straal = h * 0.29;
  const binnenStraal = straal - stokBreedte;

  // stok: volle hoogte, linkerkant
  if (lx >= x && lx <= x + stokBreedte && py >= y && py <= y + h) return true;

  // ring: linksonder aansluitend op de stok
  const cx = x + b - straal;
  const cy = y + h - straal;
  const d = Math.hypot(lx - cx, py - cy);
  return d <= straal && d >= binnenStraal;
}

function tekenIcoon(maat) {
  const pixels = Buffer.alloc(maat * maat * 3);
  const ss = 3; // 3x3 supersampling tegen kartelranden

  // letters in de veilige zone van een maskable icon (midden 60%)
  const h = maat * 0.34;
  const b = h * 0.62;
  const gat = maat * 0.06;
  const y = (maat - h) / 2;
  const bVak = { x: maat / 2 - gat / 2 - b, y, b, h };
  const dVak = { x: maat / 2 + gat / 2, y, b, h };

  for (let py = 0; py < maat; py++) {
    for (let px = 0; px < maat; px++) {
      let bTreffers = 0;
      let dTreffers = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = px + (sx + 0.5) / ss;
          const yy = py + (sy + 0.5) / ss;
          if (maaktDeelUit(x, yy, bVak, false)) bTreffers++;
          if (maaktDeelUit(x, yy, dVak, true)) dTreffers++;
        }
      }
      const totaal = ss * ss;
      let kleur = ACHTERGROND;
      if (bTreffers || dTreffers) {
        const inkt = bTreffers ? BLAUW : ORANJE;
        const dekking = (bTreffers || dTreffers) / totaal;
        kleur = inkt.map((c, i) => Math.round(c * dekking + ACHTERGROND[i] * (1 - dekking)));
      }
      const i = (py * maat + px) * 3;
      pixels[i] = kleur[0];
      pixels[i + 1] = kleur[1];
      pixels[i + 2] = kleur[2];
    }
  }
  return png(pixels, maat, maat);
}

await mkdir(resolve(root, 'assets'), { recursive: true });
for (const maat of [192, 512]) {
  const pad = resolve(root, `assets/icon-${maat}.png`);
  await writeFile(pad, tekenIcoon(maat));
  console.log(`assets/icon-${maat}.png geschreven`);
}
