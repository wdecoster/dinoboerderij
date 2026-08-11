# Credits

## Plaatjes

De plaatjes in `assets/img/` komen uit **Twemoji**, opgehaald met
`tools/haal-emoji.mjs` uit <https://github.com/jdecked/twemoji> (de onderhouden
voortzetting van het origineel van Twitter).

Twemoji-graphics: © Twitter, Inc en andere bijdragers, onder
[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).

De bestanden zijn ongewijzigd overgenomen op één punt na: er is `width` en
`height` aan het `<svg>`-element toegevoegd, omdat Firefox een SVG zonder eigen
afmetingen niet betrouwbaar in een `<canvas>` tekent.

De iconen in `assets/icon-*.png` zijn niet van Twemoji maar getekend door
`tools/maak-iconen.mjs`, en vallen onder de licentie van dit project.

## Code

De code van dit project staat onder de MIT-licentie, zie `LICENSE`.
