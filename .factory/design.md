# Retrieval Rhythm — visual thesis

## Direction: luminous glass data landscape

Retrieval should feel like a fact resurfacing, not like operating a database. The product is a dark, single-mode instrument: translucent panes hover above a midnight-teal landscape while small cyan intervals form a visible “rhythm line”. Depth explains what is active (the current recall surface) and what is ambient (progress, upcoming timing). There is no generic gradient hero and no dashboard grid; one continuous horizon line connects today’s practice to the next return.

## Palette

- `ink-950 #061817`: deep green-black page; the quiet space memory emerges from.
- `ink-900 #092321`: elevated glass shadow.
- `glass #103230 / 78%`: practice and editor surfaces.
- `glass-bright #18433f`: hover/selected surfaces.
- `paper #F1FBF7`: primary copy (15.2:1 on the page).
- `mist #B8CCC5`: supporting copy (9.6:1 on the page).
- `pulse #73F2CF`: primary action and focus (12.8:1 on the page; dark ink on pulse).
- `aqua #82CFFF`: informational timing markers.
- `sun #FFD58A`: “soon” and attention states.
- `success #8AF0A9`, `danger #FF9D9D`: outcomes, always paired with words/icons.

This single-mode treatment is intentional: a consistent dim field supports short daily review at any hour, while luminous marks make timing legible. The HTML background is painted explicitly and browser chrome uses `ink-950`.

## Type

No network fonts. The display face is Georgia (warm, editorial, human); the interface face is the local system sans stack (precise and fast). The scale is 16 / 18 / 22 / 32 / 52 px. Body is never below 16 px, line height is 1.55, and measures stay under 68 characters. Counts and durations use tabular figures.

## Space and shape

An 8 px base rhythm: 4, 8, 12, 16, 24, 32, 48, 72. Major glass surfaces use 24–32 px inset and 24 px radii; controls use 12–16 px radii and are at least 44 px tall. Borders are pale 12% highlights with a stronger top edge, like instrument glass catching light. On phones the navigation becomes a wrapping top rail, secondary landscape art recedes, and the recall/editor flow stays single-column.

## Interaction grammar

- One mint “pulse” is the primary action on a screen.
- The review answer stays visually hidden until submission; then correctness, the accepted answer, and “Due because…” appear together.
- The rhythm line has labeled marks rather than unexplained charts. Timing is never communicated by color alone.
- Keyboard path: `Tab` through controls, `Enter` submits, `1` opens Review, `2` opens Library, `3` opens Progress when focus is not in an input.
- Destructive actions name the item and require confirmation. Imports validate before replacing data and can be cancelled.
- Empty, offline, error, and update states each explain the next action.

## Motion policy

State changes use 180–240 ms opacity and transform transitions: a recalled fact rises 6 px into clarity; timing markers expand from their origin. Nothing loops. With `prefers-reduced-motion`, transforms and smooth scrolling are removed and state changes are immediate opacity cuts. Meaning and depth remain through border, scale, and contrast.

## Asset plan and art direction

One original hero illustration visualizes recall as luminous glass memory markers rising from a dark landscape. It is explanatory atmosphere on the empty/home state, not a claim about AI or product capability. Hand-authored SVG app icons reuse the three-marker rhythm motif.

Prompt sheet: **Subject:** a small procession of translucent glass memory stones rising at measured intervals across a quiet abstract landscape. **World/materials:** obsidian teal ground, frosted glass, thin luminous cyan/mint filaments, subtle archival grain. **Light/lens:** low horizon, soft volumetric rim light, slightly elevated orthographic editorial lens, large negative space. **Palette words:** midnight teal, sea-glass mint, cool cyan, one warm amber point. **Negative list:** no people, no brains, no text, no letters, no numbers, no watermark, no logos, no UI screenshot, no neon cyberpunk city, no purple gradient, no brand symbols.

Generated asset provenance: produced for Retrieval Rhythm with the factory Azure OpenAI image deployment (`factory-image`) on 2026-08-28 from the prompt sheet above. Original generated work; no people, brands, characters, or copyrighted deck content. Source PNG and prompt sidecar live in `assets/src/`; shipping WebP is optimized to ≤300 KB. The footer discloses generated imagery.
