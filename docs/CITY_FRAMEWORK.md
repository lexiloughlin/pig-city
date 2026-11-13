# Pig City: city framework

This branch has three building blocks for growing Pig City into a full city: the **city generator**, **street view** and **shop interiors**. Each one is driven by a data table in `index.html`, so most new content is a new table entry rather than new code.

## 1. City generator: "🏙️ Grow city" (Job City)

The button lays a street grid over the empty land of Job City and fills every block from a recipe. Pressing it again clears everything it made.

- **Nothing you built is touched.** Occupied tiles and existing districts are skipped, and the town is copied to `localStorage['pigcity-backup-before-city']` before growing.
- **Every block is an ordinary district**, with sidewalks, visit spots, a crowd and customers. Builder mode, moving, demolishing and the building panel all work on it.
- **What it laid is recorded.** Generated streets and crossings are listed in `G.gen` so they can be removed again.

**Where things are:**

| What | Name in `index.html` |
|---|---|
| Block recipes | `BLOCK_KINDS` |
| Where the grid goes, and which recipe each block gets | `cityPlan()` |
| How one block is filled | `growBlock()` |
| Undo | `clearGrownCity()` |

**A block recipe** has these fields:

```js
shops: { name: 'Market Street', ic: '🛍️', zone: 'com', kind: 'downtown', crowd: 6,
  corner2: [...],  // 2×2 landmark on the visible front corner (south-east)
  front:   [...],  // 1×1 shops along the two visible street fronts
  back2:   [...],  // 2×2 buildings in the back
  back:    [...],  // fillers in the back
  props:   [...] } // street props: one every few lots on the front, and in gaps
```

- `kind` sets the crowd's daily schedule (`downtown`, `finance` or `cozy`).
- `park: true` makes a plaza instead: a fountain, benches, and paths out to the sidewalks.
- **To add a new kind of block:** add a recipe, then give it a place in `cityPlan()`.

The grid uses 1-wide streets every 7 tiles, lined up with Job City's built-in main road and avenue. Zebra crossings go around every new crossroads, and traffic signals appear on their own.

### Home Town: "🏡 Grow town"

The same button appears in Home Town as **🏡 Grow town** and works the same way, with Home Town's own pieces:

- **Plan:** `homePlan()` lays 1-wide lanes around the built-in main road. Main Street and the village greens sit beside the main road, cottage lanes fill in around them, and hay meadows are at the edges.
- **Recipes** (in `BLOCK_KINDS`, marked `map: 'home'`): `cottages`, `mainstreet`, `meadow` and `green`.
- **Cottages are real homes** (4 pigs each), so the generator builds at most `HOME_COTTAGE_MAX` of them.
- **Clearing** keeps buildings you made your own, plus as many generated cottages as your pigs need to sleep in.
- What it laid is recorded in `G.genHome`, and the town is copied to `localStorage['pigcity-backup-before-town']` first.

## 2. Street view: 🚶 button or V

- **Moving:** WASD or the arrow keys walk a guinea pig, in screen directions. Hold Shift to run. The camera drops to street level and follows.
- **Collisions:** buildings, water and the edge of the map block the way; flower beds don't.
- **Going inside:** at a door, a prompt appears. Enter opens the castle's house or the shop's interior. Leaving the interior puts you back on the street where you were.
- **Leaving:** Esc or V. Builder mode also leaves street view.
- **Tuning:** walking speed, reach to a door, zoom and body size are in `STREET`. The walker uses the skin of the selected pig (or a founder) and is never saved.

## 3. Shop interiors

Any building with a `WORKPLACES` entry (wall and floor style) can be entered. If it also has an `INTERIORS` entry, its interior is drawn from data:

```js
tokiramen: {
  sign: ['TOKI RAMEN 🍜', '#d9483b', '#fff'],
  props:    [['counter', 200, 150, { w: 300 }], ['pot', 80, 96], ...], // [kind, x, y, options]
  stations: [[90, 128, 1], ...],                                      // where staff stand, one per job slot
  seats:    [[80, 178, -1, '🍜'], ...]                                // customers: x, y, facing, item icon
}
```

- **Layout:** the room is 400 × 275, and the back wall runs from y 0 to 80. Props above y 80 hang on the wall; the rest are depth-sorted with the pigs. `options.d` overrides the draw order, for things standing on a counter.
- **Furniture:** the prop library is in `iprop()`. Floor pieces: `counter`, `stool`, `table`, `bowls`, `stove`, `pot`, `shelf`, `display`, `register`, `oven`, `cooler`, `bins`, `cart`, `tellers`, `rope`, `sofa`, `plant`, `espresso`. Wall pieces: `window`, `menu`, `lanterns`, `lights`, `banner`, `vault`, `medal`, `columns`.
- **Customers** fill seats by time of day and by how many customers the shop has had today, and only while a worker is in. Otherwise the room shows a CLOSED sign.
- **Interiors so far:** Toki Ramen, Mochi Bakery, Miso Market, Bronson Bank and Wheek Coffee.
- **To add one:** add the building type to `WORKPLACES` and `INTERIORS`. New furniture kinds go in `iprop()`.

## Traffic

Cars drive the whole road network of the map on screen. They turn at crossroads (mostly going straight on), stop at red lights and behind other cars, and leave at dead ends. The look of the cars is in `TLOOKS`.

## Metro: underground tunnels between islands and towns

Both Home Town and Job City have their own metro, in **📐 Planning**:

- **🚇 Metro Station** (40 🪙) is a normal 1-tile building, type `metro`. It can go on the mainland or any island, and each station gets a station id, `b.sid`.
- **Ⓜ️ Metro Tunnel** (3 🪙 a tile): drag from one station to another. If you let go on empty land instead, a new station opens there, so the network grows one drag at a time. Tunnels go straight under water, roads and buildings.
- Tunnels are saved as `{ a, b }` station-id pairs in `G.metro[map]`. Each route is an L-shape worked out from where its two stations stand, so moving a station in builder mode moves its tunnels too. Bulldozing a station removes its tunnels and refunds half their cost.
- **Underground view:** choose it with the 🗺️ map button (the last overlay), or pick either metro tool. The town dims and the lines show on top. Each connected group of stations gets its own colour, with trains running back and forth and the pigs who are riding right now.
- **Riding:** `metroLegs()` splits a commute into drive → metro → drive whenever the metro beats driving. That always happens from an island that has no bridge. Pigs ride 2.5× faster than they drive, and `G.stats.metroRides` counts the rides.
- The save version is now `SAVE_SCHEMA = 5`.

## Ideas this framework is ready for

- **More recipes:** residential (castles with yards), a waterfront promenade, an industrial block.
- **More interiors:** cozy layouts for the other workplaces and the remaining shops.
- **Street view:** click-to-walk, sitting on benches, talking to citizens.
- **Before any of this goes online:** new building types need the save version (`SAVE_SCHEMA`) raised.
