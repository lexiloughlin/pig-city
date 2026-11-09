# Pig City art asset manifest

Pig City draws every building with built-in vector art, so the game is complete without any image files. This document lists the painted sprites that can replace that art, with the exact size, anchor and prompt for each one.

To add a sprite, save the image under `assets/sprites/` and add one line to `assets/sprites/manifest.js`. No other code changes are needed: placement, collisions, saving, depth sorting, night lighting, clicking and the build menu all pick it up. If an image is missing or fails to load, the game keeps drawing the vector art and logs a warning in the console.

## What the sprite pipeline covers

| Can be replaced by a painting | Still drawn in code |
|---|---|
| Any building or prop in the build menu (every key in `B` in `index.html`) | Roads, sidewalks, crosswalks, bike lanes, stop lines |
| Each upgrade level separately (`'tokiramen@2'`) | Citizens (guinea pigs) and their accessories |
| A separate night painting (`night:`) | Ambient cars, buses, taxis, traffic signals |

## Shared art direction (paste at the start of every prompt)

> Isometric cozy city-builder game sprite, original art. Soft colorful cartoon style with pastel pink, lavender, mint green, warm butter yellow and deep navy accents. Crisp dark-brown outlines (#5b3b2a), gentle cel shading, soft light from the upper left, so the left-facing wall is bright and the right-facing wall is in light shade. Tiny architectural details: framed windows with sky reflections, awnings, flower boxes, signs, rooftop clutter. Scaled for guinea pig citizens (a door is about 17 game px tall). Single object only, centered, transparent background, no ground tile, no drop shadow beyond a soft contact shadow, no text other than the sign named.

## Technical spec (every sprite)

- **Projection:** 2:1 dimetric isometric. A 1×1 tile's footprint is a diamond twice as wide as it is tall.
- **Resolution:** `scale: 4`, so 1 game px = 4 image px. A 1×1 footprint diamond is **256 × 128 px**; a 2×2 footprint is **512 × 256 px**.
- **Anchor `ax, ay`:** the pixel where the footprint diamond's bottom (south) corner sits. Leave about 12 px of transparent margin below it.
- **Visible faces:** only the two walls facing the bottom-left and bottom-right of the screen are ever seen. Storefronts, doors and signs go on the bottom-left wall, the street side in every district layout.
- **Format:** PNG or WebP with alpha, sRGB, no premultiplied halo. Keep edges crisp: the game re-renders at the current zoom with high-quality smoothing.
- **Night variant (optional):** the same framing with lit windows, glowing signs and a slightly darker, bluer palette. Put it in `night:`.
- **Height:** set `height` in the manifest to the value below so clicking matches the painting.

Folder layout:

```
assets/sprites/
  manifest.js
  buildings/   landmarks and shops (toki-ramen.png, toki-ramen-night.png, ...)
  props/       street furniture and trees
```

## Downtown landmarks (first block)

| Key | Footprint | Canvas (px) | Anchor ax, ay | height | File |
|---|---|---|---|---|---|
| `bronsonbank` | 2×2 | 576 × 1240 | 288, 1228 | 214 | buildings/bronson-bank.png |
| `tokiramen` | 1×1 | 320 × 480 | 160, 468 | 74 | buildings/toki-ramen.png |
| `mochibakery` | 1×1 | 320 × 480 | 160, 468 | 74 | buildings/mochi-bakery.png |
| `misomarket` | 2×2 | 576 × 600 | 288, 588 | 68 | buildings/miso-market.png |
| `wheekcoffee` | 2×2 | 576 × 740 | 288, 728 | 104 | buildings/wheek-coffee.png |

Level 2 and 3 versions add about 26 game px of height (104 image px) each. Make each canvas taller by that amount, keep the same anchor offset from the bottom, and register them as `'type@2'` and `'type@3'`.

### Prompts

**Bronson Bank** (`bronsonbank`)
> A luxurious downtown bank skyscraper on a 2×2 lot. Deep navy (#24315c) tower with gold (#d9b45a) window frames, gold bands at each setback, and two setbacks topped by a gold pyramid crown and a thin spire with a red beacon. Cream stone two-storey base with tall arched gold-framed windows. A grand columned portico with four white columns, wide steps and a small triangular pediment juts onto a pale paved plaza along the bottom-left side. Gold medallions with a guinea pig silhouette on both visible faces of the tower. Navy and gold flags on two flagpoles and potted yellow flowers on the plaza. Small hedges on the setback terrace. The sign reads "BRONSON BANK".

**Toki Ramen** (`tokiramen`)
> A cozy two-storey Japanese ramen shop on a 1×1 lot. Red storefront (#d9483b) with a navy split noren curtain over the door, a dark wood lattice window, and a warm counter window showing steaming noodle bowls. Cream upper floor with dark timber beams and white shoji windows with pink flower boxes. Dark slate gable roof with wide eaves. Four red and yellow paper lanterns hang along the front. A cream vertical banner on the corner, a short wooden counter with two red stools and a ramen bowl out front, and a giant smiling ramen bowl with chopsticks and steam on the roof. The sign reads "TOKI RAMEN".

**Mochi Bakery** (`mochibakery`)
> A charming pastel bakery on a 1×1 lot. Pastel pink ground floor (#f6c3cf) with a mint trim band, a large display window with three shelves of colorful mochi, cakes and a small tiered cake, and a mint door with a round window. Pink-and-white striped scalloped awning. Cream upper floor with white-framed windows and flower boxes. Lavender mansard roof with a dormer, a pink chimney puffing a little smoke, and a giant smiling pink mochi with a mint leaf on the roof. A chalkboard A-frame and two flower pots on the step. The sign reads "MOCHI BAKERY".

**Miso Market** (`misomarket`)
> A friendly neighborhood grocery on a 2×2 lot. Low mint-green building (#9fd8bf) with a cream parapet and a raised sign board. A long storefront of glass panes showing colorful shelves, with sliding doors in the middle. Green-and-white striped scalloped awnings shade two rows of wooden produce crates spilling onto the pavement: carrots, peppers, lettuce, apples, lemons and grapes. A "FRESH" price sign and a small shopping cart. A grey roll-up delivery door with stacked crates on the bottom-right side. HVAC units, a skylight and raised garden beds on the roof. The sign reads "MISO MARKET" with a small carrot icon.

**Wheek Coffee** (`wheekcoffee`)
> A large three-storey corner café on a 2×2 lot. Butter-yellow walls (#f5d58a) with white trim and coffee-brown (#7a4b2e) accents. A round corner tower with arched windows, a brown dome and a giant smiling coffee cup on top. Big ground-floor windows on both visible sides with customers inside, under brown-and-cream striped scalloped awnings. An L-shaped outdoor terrace along both street sides with small round tables, striped umbrellas, guinea pig customers, flower planters and a "LATTE" chalkboard. A rooftop patio with a white railing, two umbrella tables, planters and strings of colored lights. The signs read "WHEEK COFFEE" and "WHEEK".

## Street props

| Key | Footprint | Canvas (px) | Anchor ax, ay | height | File |
|---|---|---|---|---|---|
| `blossom` | 1×1 | 320 × 400 | 160, 388 | 52 | props/blossom-tree.png |
| `bikerack` | 1×1 | 288 × 200 | 144, 188 | 14 | props/bike-rack.png |
| `hydrant` | 1×1 | 288 × 200 | 144, 188 | 15 | props/hydrant.png |
| `streetlamp` | 1×1 | 288 × 340 | 144, 328 | 46 | props/street-lamp.png |
| `citytree` | 1×1 | 320 × 380 | 160, 368 | 46 | props/street-tree.png |
| `bench` | 1×1 | 288 × 220 | 144, 208 | 22 | props/bench.png |
| `busstop` | 1×1 | 288 × 300 | 144, 288 | 36 | props/bus-stop.png |
| `planter`, `hedge`, `trash`, `mailbox` | 1×1 | 288 × 200 | 144, 188 | 16–22 | props/*.png |

Props should fill only the middle of the tile (about 60%), so neighbors don't overlap.

**Blossom Tree** (`blossom`)
> A small street tree in a round pale-stone planter, with a slightly curved brown trunk and a fluffy rounded canopy of layered pink cherry blossom puffs in two pinks with white highlights. A few fallen petals around the planter.

**Bike Rack** (`bikerack`)
> Three grey steel hoops in a row, with a red bicycle and a blue bicycle parked in them. The red one has a little wicker basket.

**Fire Hydrant** (`hydrant`)
> A short, cheerful red fire hydrant with a yellow cap and two side nozzles.

## Next sprites to plan (phase 5 catalog)

These buildings aren't in the game yet. They follow the same spec as the landmarks above. Each needs a `B` entry, a `JOBS` / `PROFILE` entry and vector art (or a sprite) when it's built.

| Planned key | Footprint | Notes for the prompt |
|---|---|---|
| `masakicap` | 2×2 | Modern glass office tower with teal windows, rooftop structure, "MASAKI CAPITAL" sign. The existing `bank` building is named Masaki Capital; decide whether to restyle it or add a downtown version. |
| `cavytech` | 2×2 | Contemporary tech office with visible desks and monitors through the glass |
| `pcnews` | 2×2 | Media HQ with a rooftop satellite dish and a lit "PIG CITY NEWS" ticker |
| `cityhall` | 2×2 | Civic building with columns, steps, a dome and flags |
| `construction` | 2×2 | Active site with a crane, scaffolding, barriers and hard-hat workers |
| `pokepizza`, `florist`, `burrowbooks`, `goldencarrot` | 1×1 | Storefronts with sidewalk displays |
| `hayco`, `cinema`, `hotel`, `metro`, `firestation`, `clinic`, `garage`, `postoffice`, `police` | 2×2 | Services and big retail |
| `brownstone`, `luxtower`, `townhouse`, `mixeduse` | 1×1 / 2×2 | Residential; needs a housing rule for Job City first |
