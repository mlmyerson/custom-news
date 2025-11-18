📐 Custom News – Mosaic Layout Design Plan

A mobile-first, image-rich, generative news collage.

1. High-Level Concept

The Mosaic layout is a mobile-first generative collage of article tiles.
Instead of a scrolling list or bubble grid, the app constructs an aesthetic, semi-random, rule-driven tile layout somewhat inspired by:

magazine spreads

architectural tessellations

cellular automata

wave-function collapse

quilt patterns

Each refresh becomes a new composition, unique but coherent.

Tiles fade, breathe, and display rotating images extracted from headlines, turning the entire screen into a living gallery of the news.

The user updates the mosaic on demand, ensuring the layout is stable and readable.

2. Alignment With Mobile Constraints

Tiles must be tap-friendly (minimum ~90px dimension).

No small fonts.

No requiring perfect pointer precision.

Tiles should feel like “cards” — self-contained, tactile, and comfortably spaced.

The layout should avoid tiny tiles entirely. Every shape must be large enough for finger interaction.

3. Tile Anatomy

Each tile contains:

Image layer

A stack of 2–5 images that fade slowly.

Auto-cropped to preserve the most informative area.

Optional tinting (per category or theme).

Overlay

A gradient overlay to boost text contrast.

A soft highlight on hover/tap.

Text block

Headline (shortened if necessary).

Source logo or source label.

Optional category tag.

Tile frame

Subtle border or shadow.

Slight corner radius (4–10px).

Interaction states

idle → hover → focus → open

4. Tile Shape Library

We define a small set of tile shapes that tile well on mobile:

1×1 (square) — the most common

2×1 (wide rectangle)

1×2 (tall rectangle)

2×2 (feature tile)

Dimensions are in grid units; actual pixels depend on screen width.

Rules:

All shapes are integer multiples of a base block size.

Tiles must not be smaller than ~90px in either dimension.

Feature tiles (2×2) are used sparingly to highlight important stories.

5. Tile Differentiation (Borders & Identity)

To prevent visual blending:

Borders: 2px semitransparent line OR

Gaps: 6–8px between tiles OR

Shadow: subtle drop shadow OR

Accent line: small colored strip (category-based)

You can mix two but don’t use all four; subtlety is key.

6. Image Acquisition Pipeline
A. Extracting Key Phrases

Use one of the following (in order of ease):

compromise.js (lightweight POS tagging)

wink-nlp (fast, browser-friendly)

spaCy (backend)

HF keyphrase-extraction models

Google NLP (paid, strongest)

Goal: extract 1–3 nouns / noun phrases from the headline.

Example:
“US Economy Shows Signs of Slow Recovery After Turbulent Quarter” →
["US Economy", "Recovery", "Quarter"]

B. Image Search

Use:

Google Custom Search JSON API (best results)

Bing Image Search API (cheaper)

DuckDuckGo (free API proxies exist)

Pull 3–5 images per tile.

C. Auto-Cropping

Techniques:

Basic: center-crop + object detection fallback

Advanced: Google Vision smart-crop

Optional: face detection to prioritize faces in political or human-interest stories

D. Fade Animation

Each tile fades between its images:

6–12 seconds per fade

Crossfade: opacity transition

Loop infinitely

On tile tap/focus: pause fade (optional)

7. Mosaic Generation Rules

This is the heart of the system.

7.1. Grid Setup

Define a virtual grid based on screen width.

For mobile: 4–6 columns.

Height expands based on tile placements.

7.2. Placement Algorithm (Simple CA-style Rules)
Rule Set

Start at the top-left cell.

Choose a shape based on weighted probability:

1×1: 55%

2×1: 20%

1×2: 15%

2×2: 10%

Check if the shape fits in the remaining cells of the row/column.

If it fits, place it.

If not, degrade to a smaller shape (e.g., fail 2×2 → 2×1 → 1×1).

Move to the next available empty cell.

Continue until all tiles/stories are placed or grid height is sufficient.

This produces an organically varied but structured layout.

Optional CA Enhancements

If a large tile is placed, favor small tiles adjacent to it (visual rhythm rule).

Don’t place two 2×2 tiles directly next to each other (avoid block clumping).

Try alternating orientation each row (e.g., row 1 prefers wide tiles, row 2 prefers tall tiles).

8. Importance-Based Influence

Use the story metadata to adjust layout probabilities:

Breaking news → higher chance of 2×2 tile

High-frequency topics → slightly larger shapes

Evergreen articles → 1×1 or 2×1

Featured sources → larger tile possibility

This ensures the mosaic also conveys meaning.

9. Interactions
A. Tap to Expand

Tile grows or pushes neighbors aside.

Opens a modal/card.

Background tiles dim softly.

B. Long Press Behavior

Optional:

Bookmark article

Share link

Save for later

C. Swipe Behavior

Swipe left/right on a tile: cycle tile size (1×1 → 2×1 → 1×2 → back)

Swipe down to remove tile from mosaic

Swipe up to open article

10. Refresh Flow

The mosaic is not continuous (unlike the bubble river).
Instead:

User taps “Refresh Mosaic.”

Fetch all sources.

Run pipeline:
(articles → phrase extraction → image search → tile assignment)

Animate old mosaic out

Animate new mosaic in

Animation Ideas

Tiles drop in like puzzle pieces

Tiles fade in with small upward drift

Tiles slide into place with easing

Small “shimmer” highlight across the mosaic

11. Themes (Optional but Recommended)

Offer a few style modes:

A. Pastel Magazine (default)

Soft colors, rounded corners, high readability.

B. Noir (high contrast)

Black background, bold white text, desaturated images, cinematic.

C. Neon Glass

Glassmorphism, glowing edges, futuristic shine.

D. Newsprint

Muted textures, serif fonts, editorial feel.

Themes only affect:

tile border style

overlay style

image tint

typography

Not the tile shapes or placement rules.

12. Performance Considerations

Limit image resolution (700–900px max).

Preload at least 1 image per tile.

Lazy-load additional images.

GPU-accelerated transforms (translate, scale, opacity).

Reuse tile DOM nodes between mosaics when possible.

Avoid heavy layout thrashing — calculate grid positions in JS and apply transforms.

13. Accessibility

Provide a “static mode” that disables all fades/animations.

Provide alt-text derived from headlines.

Ensure contrast ratios exceed WCAG requirements.

For screen readers: tiles should announce headline + source + “tile X of Y.”

14. Summary (TL;DR)

The Mosaic layout is a generative, image-driven, mobile-first tile system governed by simple but expressive rules:

Article tiles vary in size and orientation.

Images fade gently to give life to the layout.

The whole mosaic is re-generated on demand, not continuously.

Cellular automata–like rules determine tile placement.

The result feels like discovering a fresh magazine spread with each refresh.

This becomes the app’s identity:
a living collage of the world’s news.