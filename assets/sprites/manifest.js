// Pig City illustrated sprite manifest.
//
// While this list is empty, the game draws every building with its built-in vector art. To swap in a painted
// sprite, drop the image into assets/sprites/... and add an entry below. Nothing else needs to change: placement,
// collisions, saving, depth sorting, night lighting and clicking all keep working.
//
//   key      a building type from B in index.html ('tokiramen'), or 'type@level' for one level ('tokiramen@2')
//   src      the daytime image (PNG or WebP with a transparent background)
//   night    optional image used after dusk (lit windows, glowing signs)
//   ax, ay   the pixel in the image where the bottom (south) corner of the building's footprint diamond sits
//   scale    image pixels per game pixel (default 4: one 1x1 tile footprint is 256 px wide in the image)
//   height   optional: how tall the building stands above its footprint, in game pixels (used for clicking)
//
// The full list of planned sprites, with sizes, anchors and image-generation prompts, is in
// docs/ART_ASSET_MANIFEST.md.
window.PIG_SPRITES = Object.assign(window.PIG_SPRITES || {}, {
  // Cavy Apartments (a pig home at level 3): the painted Pig City Apts illustration. Anchored at the building's front corner
  // so the sidewalk plate spills a little past the 2x2 footprint, the way the picture does.
  'hutch@3': { src: 'assets/sprites/buildings/cavy-apartments.webp', night: 'assets/sprites/buildings/cavy-apartments-night.webp', ax: 457, ay: 825, scale: 5.4, height: 90 },
  // tokiramen:   { src: 'assets/sprites/buildings/toki-ramen.png', night: 'assets/sprites/buildings/toki-ramen-night.png', ax: 256, ay: 600, scale: 4, height: 74 },
  // bronsonbank: { src: 'assets/sprites/buildings/bronson-bank.png', ax: 512, ay: 1400, scale: 4, height: 214 },
});
