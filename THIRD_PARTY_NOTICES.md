# Third-party materials

This is an unofficial fan recreation, not a Nokia product.

The binary levels in `public/levels`, original PNGs and OTT sound sequences in `public/assets`, and the reference behaviour adapted in `src/game/ball.ts` come from [rndtrash/nokia-bounce-decomp](https://github.com/rndtrash/nokia-bounce-decomp), pinned at `8ddc40eba9484fc74706e27066fbd36ca6cbe25d`. The upstream repository includes the WTFPL text, retained in `docs/reference/upstream-license.txt`. That repository license does not establish ownership of Nokia's original artwork, game data or sounds. Those original materials remain attributable to their respective owners; this project makes no claim to them and does not offer them under a new blanket license.

`docs/reference/assets.json` records every bundled original asset, source URL and checksum. Web menus, input adapters, storage and rendering integration are created for this project. The tiny HUD digits are a replacement bitmap font, not an extracted Nokia system font.

The [Bounce Zero](https://github.com/amdray/bounce_zero) parser was consulted to cross-check the eight-byte hazard records and Nokia OTT note format. Its project describes its implementation as MIT-licensed and its original assets as belonging to Nokia and/or Sun Microsystems. The browser code uses its own parsers and Web Audio playback.

Asset redistribution provenance is documented above; no explicit Nokia redistribution grant was found during this implementation. Preserve this notice with copies of the project.
