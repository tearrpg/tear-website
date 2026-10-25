# Manual Publish Spell Updates command

The website uses a one-click, **manual**, Google Sheets publishing menu. It does not run on a schedule or silently publish while you edit.

## One-time setup required by the spreadsheet owner

1. Open the `RPG Project Spells` Google Sheet, then `Extensions` → `Apps Script`.
2. Copy the contents of `integrations/google-apps-script/Code.gs` into that spreadsheet-bound Apps Script project and save it. This code is a checked-in example; it has not yet been installed into the Google Sheet.
3. Create a **fine-grained GitHub personal access token**, limited to repository `tearrpg/tear-website`, with `Contents: Read and write` permission. Give it a reasonable expiry; renew later as necessary. Never paste the token into ChatGPT, GitHub source files, the sheet itself, or emails.
4. In the Apps Script project, open **Project Settings** → **Script properties**. Add property `GITHUB_TOKEN` with the token as its value. Do not store it in code.
5. Save, reopen the spreadsheet, and select **Tear Website → Publish spell updates**. The first run will ask you to grant the script permission to read the sheet and call GitHub. Review the requested permissions carefully.
6. Confirm the spell count. The script commits a fresh read-only snapshot to GitHub `main`. GitHub Actions then validates, rebuilds Astro, and deploys the updated site. The Google spreadsheet is never edited.

Because the bound Apps Script project can be accessible to other editors of the spreadsheet, only trusted editors should have script access while it holds a GitHub token. Revoke a lost or leaked token immediately.

## New Schools and tabs

The script enumerates all visible sheets when the **Publish** action is pressed. It skips known administrative/template tabs and old/hidden tabs. Other sheets are included if they contain the standard `Spell Name` label in column A. Newly added School tabs are discovered without editing either the importer or a fixed list of School names. Empty named-template slots contribute zero published spells. School names in actual spellblocks must match the tab names.

A new School tab should use the existing vertical spellblock layout and include a matching **School** field on each spell. A new non-spell tab without this structure is ignored.

## How updates actually work

Google Sheet → (manual publish menu) → GitHub snapshot → (automatic validation & Astro build) → GitHub Pages.

The actual spreadsheet-to-GitHub step is **not connected until setup above is completed**. A GitHub workflow's existing `Run workflow` button only rebuilds the last saved snapshot; it does not read live Google Sheets. The menu command is the intended live-data refresh button.

Incomplete spell entries are published but marked as works in progress, with missing values left empty and logged as warnings. Structural problems (duplicate identifiers, mislabeled Schools, etc.) stop the build so the existing deployed website stays in place.

## Design scope

No commissioned School borders, illustrated frames, or special art are required for any of this. The importer is only concerned with spell data.
