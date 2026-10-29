# Artwork gallery for Tear spells

Artwork is a separate, manually maintained collection. It does not edit spell statistics or Google Sheets.

The first illustration is now attached to **Earth Bolt** (Evocation). The on-site artist credit is **Jade Saserna**. The uploaded TIFF was converted to an optimized 1080×1080 WebP for web delivery; the drawing's composition was not changed.

## Adding a new illustration
1. Add a web-ready image in `public/art/spells/`.
2. Edit `src/data/spell-artwork.mjs` under the spell's **actual** ID, for example `evocation-earth-bolt`.
3. Add an image object with a unique `id`, local `src`, `artist` credit, `alt` description, and optional `title` and `caption`.
4. Choose the image displayed by default with the gallery's `defaultId`.
5. When a gallery contains only one illustration, no Previous/Next buttons appear. When multiple images exist, visitors can switch illustrations in the existing artwork box and see each image's own artist credit.
6. Artwork and artist credits are not part of the spell data publication pipeline, so publishing from Google Sheets never overwrites them.

Optional flavor text is a **separate spell-level feature**, not part of the artwork credit. No flavor quotation was supplied for Earth Bolt and none has been invented.

These images remain copyrighted by their respective artists unless the rights holder explicitly specifies otherwise.
