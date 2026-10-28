# Tear website navigation blueprint — v1

This file records the approved structure of the public website's **clickable navigation wireframe**, not finalized lore, rules, artwork or marketing copy.

## Homepage (approved layout)
1. Site header with top-right navigation (exact header links **provisional**).
2. Large TEAR title and exactly **two primary hero buttons**:
   - **Create a Character** → the Species selection step directly
   - **Explore the World** → a two-choice landing page
3. **What is Tear?** elevator pitch (text is provisional; a major future writing task).
4. Exactly **three** cards underneath: Create a Character, Explore the World, Rules Reference.
5. A modest **About the Project** link/CTA, not the Patreon pitch itself.
6. Standard footer. The old three placeholder homepage sections were removed.

## Character creation
Species selection (Human, Tor, Dow, Zia, Azu, Vessel) → species detail → Facets → Attributes → Skills → Starting Equipment → Finish / How to Play.

Species detail pages have reserved artwork and Back / Choose-and-Continue navigation. Facets have basic detail pages. Character building calculations, character-sheet strategy, and exact instructions remain **unresolved**. None of the prototype navigation claims to save selections. The RPG Project sheet currently lists **nine facet names**; an earlier conversation said six. This deserves review when completing the facet rules.

## Explore the World
Landing page with artwork placeholder and **two choices**:
1. **Take a Guided Tour:** ordered, illustrated, prose-first stops, each with Previous/Next and optional hyperlinks to the Library. The tour concludes with **Visit the Library** and **Create a Character** buttons. Current Arcoleths → Portals → Magic Colleges stop sequence is a **demonstration only**, not the chosen final itinerary.
2. **Visit the Library:** categories → subcategories → published articles; avoid creating hundreds of empty article pages. Broad sections exist now with clearly labeled planned shelves.

## Library
Possible categories: Religion & Gods, History, Society, Inhabitants, Creatures, Geography, Magic, Curiosities. Classifications may change. A term should ultimately link to its canonical article only after that article exists. Library navigation includes a route into the Rules Reference. Magic may link to the existing Spell Reference; Creatures may link to the Bestiary.

## Rules Reference
Organized like the Library, but for mechanics: Core Mechanics, Combat, Magic & Spells, Afflictions, Equipment, Skills & Facets, Bestiary. Categories link to their subsections, then to actual published references. Equipment categories do **not** create empty item pages. The existing /spells/ system is preserved unchanged.

## About the Project
Separate destination describing the creator's motivations and, eventually, linking to Patreon. **Do not invent a Patreon URL.** The homepage should not contain a direct fundraising appeal.

## Development principles
- Plan broadly, build reusable templates, publish only worthwhile articles.
- One canonical page may be linked from multiple different paths.
- Preserve existing Google Sheets/Docs as source material; avoid inventing rules or private lore for placeholder pages.
- Move prose out of template code as the content system is introduced.
- Keep the live spell importer, publisher, and spell pages isolated from unrelated site work.
- Later possibilities: automated glossary hyperlinks, Imperial/non-Imperial narrated views, richer art, guided tour authoring, proper character builder. **These are not implemented in this wireframe.**

## Current implementation
- Site navigation data: src/data/site-map.mjs
- Shared layout: src/layouts/SiteLayout.astro
- Shared styles: src/styles/site.css
- Home: src/pages/index.astro
- Character guide: src/pages/create/
- World and tour: src/pages/world/
- Rules Reference: src/pages/rules/
- About: src/pages/about/
- Existing spell reference remains at src/pages/spells.astro

Each group can be expanded independently. No need to duplicate articles or rebuild their content source manually.
