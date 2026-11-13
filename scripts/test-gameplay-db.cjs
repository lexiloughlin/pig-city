'use strict';
const assert=require('node:assert/strict'),os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const {GameplayDB}=require('../electron/gameplay-db');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pigcity-db-test-')),filename=path.join(folder,'gameplay.sqlite');
let db=new GameplayDB(filename);
const event={id:'11111111-1111-4111-8111-111111111111',town_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',kind:'wage_paid',entity_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',game_day:1,game_time:0,occurred_at:'2026-11-12T00:00:00Z',data:{amount:0}};
db.put([event,event]);assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').length,1);assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')[0].data.amount,0);
assert.throws(()=>db.put([{...event,data:{amount:10}}]),/collision/);
db.put([{...event,id:'snapshot/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/1/pig/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',kind:'pig_snapshot',data:{state:{happiness:0}}}]);
db.put([{...event,id:'snapshot/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/1/pig/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',kind:'pig_snapshot',data:{state:{happiness:90}}}]);
assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').length,2);assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')[1].data.state.happiness,0);
assert.equal(db.claim('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-a'),true);assert.equal(db.claim('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-b'),false);
assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-a',1).length,1);
db.ack([event.id],'user-a');assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-a').length,1);
assert.throws(()=>db.put([{...event,id:'22222222-2222-4222-8222-222222222222'},{...event,id:'bad',game_day:0}]),/Invalid/);
assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').length,2); // whole invalid batch rolled back
assert.equal(db.db.prepare('select earnings from gameplay_earnings').get().earnings,0);
db.close();db=new GameplayDB(filename);assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').length,2);assert.equal(db.rows('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','user-a').length,1);db.close();
console.log('PASS SQLite: durable reopen, retry deduplication, daily snapshot deduplication, zero values, owner isolation, acknowledgments, atomic rollback and earnings view');
