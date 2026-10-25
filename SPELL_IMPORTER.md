# Spell converter — first milestone

This is the first **read-only** importer for Tear's source spellblocks. It parses vertically arranged spreadsheet entries into structured records usable by the Astro spell template.

## Current state

- The full Inertia tab was inspected via the connected Google Sheets source. It has **nine populated spellblocks**, followed by empty template blocks.
- The importer is implemented and tested using **synthetic fixtures only**. Neither the full Inertia content nor an exported snapshot has been committed to this public repository.
- The published spell page still shows the original two public sample spells. **No automatic Google Sheets syncing or publication is enabled.**

## Input format

Obtain a bounded, read-only Google Sheets values range (e.g., \`Inertia!A34:D352\`) and save its result in JSON:

\`\`\`json
{
  "sheet": "Inertia",
  "startRow": 34,
  "values": [
    ["Spell Name", "Example Test Spell"],
    ["College:", "Kinetics", "Minimum Level:", "1"]
  ]
}
\`\`\`

The \`values\` array must preserve row positions; if you read a range beginning at A34, \`startRow\` must be 34. Blank or missing trailing cells are handled.

## Running

\`\`\`bash
npm install
npm run test:import
npm run import:spells -- path/to/inertia-snapshot.json path/to/inertia-spells.json
\`\`\`

The converter looks for \`Spell Name\` rows in column A and uses row labels rather than fixed offsets. It handles minor differences in capitalization, spaces, colons, and dash styles, and reports legacy label aliases. Blank spell-name templates are ignored. Empty numerical fields are not silently invented; required-field errors stop the output.

Diagnostics contain the exact spreadsheet tab and cell. No part of this program edits Google Sheets.

## Next milestones

1. **Approve content for public release:** review the nine Inertia spells and choose which may be published on the public Tear website. A GitHub branch is not private when the repository is public.
2. Save an authorized read-only snapshot or selected spell data and run the importer.
3. Connect the resulting validated JSON data to the existing Astro spell template (replace hardcoded two-spell array).
4. Only after that, design a controlled refresh workflow. That might be deliberate manual publishing before any automatic syncing.

No credentials, private Google Sheets tokens, or unpublished worldbuilding source documents should be committed to this public repository.
