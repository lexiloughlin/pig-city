/* Shared browser/Node simulation timing and save policy. No rendering or wall-clock catch-up. */
(function (root) {
  'use strict';
  const SCHEMA = 5;
  function valid(s) {
    return !!s && typeof s === 'object' && Array.isArray(s.pigs) && Array.isArray(s.buildings)
      && s.pigs.every(p => p && typeof p === 'object' && Number.isFinite(p.id))
      && s.buildings.every(b => b && typeof b.type === 'string')
      && (s.clock === undefined || Number.isFinite(s.clock))
      && (s.time === undefined || Number.isFinite(s.time));
  }
  function decode(text) {
    const j = JSON.parse(text), s = j && j.pigcity && j.town ? j.town : j;
    if (!valid(s)) throw Error('Invalid Pig City town');
    if (s.schema !== undefined && (!Number.isInteger(s.schema) || s.schema < 1)) throw Error('Invalid save version');
    return s;
  }
  function migrate(s) {
    if (!valid(s)) throw Error('Invalid Pig City town');
    if ((s.schema || 1) > SCHEMA) return s;
    // Versions 1–4 are deliberately additive: initExtras retains the existing
    // building/room/job migrations. Preserve unknown fields and tracking IDs.
    if (s.clock === undefined) s.clock = 0;
    if (s.time === undefined) s.time = 0;
    s.schema = SCHEMA;
    return s;
  }
  class Clock {
    constructor({step = 1 / 30, maxFrame = .25, maxSteps = 8} = {}) {
      this.step = step; this.maxFrame = maxFrame; this.maxSteps = maxSteps;
      this.pending = 0; this.steps = 0; this.dropped = 0;
      this.tasks = new Map();
    }
    reset() { this.pending = 0; }
    every(name, interval, run) { this.tasks.set(name, {interval, pending: 0, run}); }
    advance(realSeconds, speed, paused, run) {
      if (paused) { this.reset(); return 0; }
      if (!Number.isFinite(realSeconds) || realSeconds < 0) return 0;
      const accepted = Math.min(realSeconds, this.maxFrame);
      this.dropped += realSeconds - accepted;
      this.pending += accepted;
      let n = 0;
      while (this.pending + 1e-10 >= this.step && n < this.maxSteps) {
        this.pending = Math.max(0, this.pending - this.step);
        // Real-time cadence remains 30Hz at all speeds; bounded variable game
        // steps (1/30–1/10s) preserve the game's existing movement assumptions.
        const dt = this.step * Math.max(1, Math.min(3, speed || 1));
        run(dt);
        for (const task of this.tasks.values()) {
          task.pending += dt;
          if (task.pending + 1e-10 >= task.interval) {
            const elapsed = task.pending; task.pending = 0; task.run(elapsed);
          }
        }
        n++; this.steps++;
      }
      return n;
    }
  }
  const api = {SCHEMA, valid, decode, migrate, Clock};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PigSimulation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
