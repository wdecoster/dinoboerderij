// Eén beweging, drie manieren om hem te geven: tikken op de linker- of
// rechterhelft, klikken met de muis, of de pijltjestoetsen. Alle drie leveren
// exact dezelfde melding op ('links' of 'rechts').

export function maakInvoer(doek, opKeuze) {
  function aanwijzer(ev) {
    const vak = doek.getBoundingClientRect();
    if (vak.width === 0) return;
    ev.preventDefault();
    opKeuze(ev.clientX - vak.left < vak.width / 2 ? 'links' : 'rechts');
  }

  function toets(ev) {
    if (ev.repeat) return;
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      opKeuze('links');
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      opKeuze('rechts');
    }
  }

  doek.addEventListener('pointerdown', aanwijzer);
  window.addEventListener('keydown', toets);

  return () => {
    doek.removeEventListener('pointerdown', aanwijzer);
    window.removeEventListener('keydown', toets);
  };
}
