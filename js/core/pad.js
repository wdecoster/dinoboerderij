// Waar staat de site-root?
//
// De spelletjes staan in games/<naam>/, de plaatjes in assets/img/. Een pad als
// 'assets/img/1f333.svg' zou vanuit een spelpagina naar games/<naam>/assets/…
// wijzen. Daarom leiden we de root één keer af uit de locatie van deze module
// (js/core/pad.js → twee mappen omhoog). Dat werkt zowel op localhost als
// onder /leesspel/ op GitHub Pages, zonder ergens een basis-URL te hardcoderen.

export const WORTEL = new URL('../../', import.meta.url);

/** Maakt van een pad t.o.v. de site-root een volledige URL. */
export function vanWortel(pad) {
  return new URL(pad, WORTEL).href;
}
