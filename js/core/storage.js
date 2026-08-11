// Dun laagje over localStorage. Alles onder één voorvoegsel, en alles in een
// try/catch: in een privé-venster gooit localStorage, en dan moet het spel
// gewoon doorspelen zonder te onthouden in plaats van stuk te gaan.

export function maakOpslag(ruimte) {
  const sleutelVan = (naam) => `leesspel:${ruimte}:${naam}`;

  return {
    lees(naam, standaard) {
      try {
        const rauw = localStorage.getItem(sleutelVan(naam));
        return rauw === null ? standaard : JSON.parse(rauw);
      } catch {
        return standaard;
      }
    },
    schrijf(naam, waarde) {
      try {
        localStorage.setItem(sleutelVan(naam), JSON.stringify(waarde));
      } catch {
        /* niets te doen; niet kunnen onthouden is geen fout */
      }
    },
  };
}
