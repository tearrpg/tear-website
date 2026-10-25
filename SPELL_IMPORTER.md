# Inertia spell import

The public spell browser is generated from a read-only Inertia spreadsheet snapshot. The source range was Inertia!A34:D352, with nine named spells and empty template slots.

## Pipeline

1. ChatGPT reads the live Google Sheets range without making edits, then updates scripts/snapshots/inertia.values.json.
2. Every npm run build automatically runs scripts/convert-spells.mjs (via prebuild) to generate src/data/inertia-spells.json.
3. The Astro page imports the generated records and renders all nine spells using one template.
4. GitHub Pages serves the new generated site.

## Refreshing the source

Fetch the current Inertia range again, replace the values in the saved JSON snapshot (and extend the bounded range as needed), and commit through a pull request. Validation and the Astro build run before publishing. No manual spellblock HTML editing is necessary.

IMPORTANT: This import is automatic from a saved spreadsheet snapshot at build time. GitHub is not yet automatically querying Google Sheets for current values. Fully automatic sheet-to-repository synchronization requires a separate authorized integration.

The Google source sheet is never edited by this pipeline. The source snapshot is public with the project owner's permission. The converter reports exact cell addresses and blocks publishing if required data is missing. A test suite verifies all nine Inertia entries.

Commands: npm install; npm run test:import; npm run dev; npm run build.

Unimplemented: continuous live source synchronization, other Schools, per-spell routes, and unique artwork frames.
