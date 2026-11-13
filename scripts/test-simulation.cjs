'use strict';
const assert = require('node:assert/strict');
const {Clock, decode, migrate, SCHEMA} = require('../assets/js/simulation');
for (const hz of [15, 30, 60, 120, 144]) for (const speed of [1, 2, 3]) {
  const c = new Clock(); let elapsed = 0, production = 0, calls = 0;
  c.every('production', .5, dt => { production += dt; calls++; });
  for (let i = 0; i < hz * 10; i++) c.advance(1 / hz, speed, false, dt => elapsed += dt);
  assert(Math.abs(elapsed - 10 * speed) < 1e-8, `${hz}Hz, ${speed}x timing`);
  assert.equal(c.steps, 300); assert(calls <= speed * 20);
  assert(Math.abs(production + c.tasks.get('production').pending - elapsed) < 1e-8);
}
const c = new Clock(); let time = 0;
c.advance(.02, 1, false, dt => time += dt); c.advance(100, 1, true, dt => time += dt);
assert.equal(time, 0); assert.equal(c.pending, 0);
c.advance(100, 3, false, dt => time += dt); assert(c.steps <= 8); assert(time <= .8); assert(c.dropped > 99);
for (const schema of [undefined, 1, 2, 3, 4, 5]) {
  const town = {pigs:[{id:1, trackingId:'stable', job:{map:'city',x:1,y:2}}], buildings:[], clock:123, custom:{keep:true}};
  if (schema) town.schema = schema;
  const result = migrate(decode(JSON.stringify({pigcity:1,town})));
  assert.equal(result.schema, SCHEMA); assert.equal(result.clock, 123);
  assert.equal(result.pigs[0].trackingId,'stable'); assert.deepEqual(result.custom,{keep:true});
  assert.deepEqual(migrate(result),result);
}
const future = {schema:99,pigs:[],buildings:[]}; assert.equal(migrate(future),future); assert.equal(future.schema,99);
for (const text of ['{', '{}', '{"pigs":[],"buildings":null}', '{"schema":"bad","pigs":[],"buildings":[]}', '{"pigs":[null],"buildings":[]}']) assert.throws(() => decode(text));
console.log('PASS: 15–144Hz, 1–3x, pause, bounded stalls, scheduled elapsed time, versions 1–5, wrapped saves, stable IDs/jobs, future versions, malformed saves');
