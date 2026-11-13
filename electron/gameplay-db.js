'use strict';
const {DatabaseSync} = require('node:sqlite');
const {validate,canonical} = require('../assets/js/gameplay-tracking');
const fs = require('node:fs'), path = require('node:path');
class GameplayDB {
  constructor(filename) {
    fs.mkdirSync(path.dirname(filename), {recursive:true});
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, town_id TEXT NOT NULL, kind TEXT NOT NULL,
        entity_id TEXT, game_day INTEGER NOT NULL, game_time REAL NOT NULL,
        occurred_at TEXT NOT NULL, payload TEXT NOT NULL, synced_to TEXT);
      CREATE INDEX IF NOT EXISTS events_town ON events(town_id);
      CREATE TABLE IF NOT EXISTS owners (town_id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
      CREATE VIEW IF NOT EXISTS gameplay_earnings AS SELECT town_id, entity_id AS pig_id,
        game_day, SUM(json_extract(payload, '$.data.amount')) AS earnings
        FROM events WHERE kind='wage_paid' GROUP BY town_id,entity_id,game_day;
      CREATE VIEW IF NOT EXISTS gameplay_pig_snapshots AS SELECT town_id,entity_id AS pig_id,
        game_day,json_extract(payload,'$.data.state') AS state
        FROM events WHERE kind='pig_snapshot';`);
  }
  put(events) {
    if (!Array.isArray(events) || events.length > 200) throw Error('Invalid gameplay batch');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for(const e of events) {
        validate(e);
        const payload=JSON.stringify(e);if(payload.length>100000)throw Error('Gameplay event too large');
        const existing=this.db.prepare('SELECT payload FROM events WHERE id=?').get(e.id);
        if(existing && !/^(snapshot|register)\//.test(e.id) && canonical(JSON.parse(existing.payload))!==canonical(e)) throw Error('Gameplay event ID collision');
        this.db.prepare('INSERT OR IGNORE INTO events(id,town_id,kind,entity_id,game_day,game_time,occurred_at,payload) VALUES(?,?,?,?,?,?,?,?)').run(e.id,e.town_id,e.kind,e.entity_id||null,e.game_day,e.game_time,e.occurred_at,payload);
      }
      this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  rows(town_id, pendingFor=null, limit=1000000000) {
    const rows = pendingFor ? this.db.prepare('SELECT payload,synced_to FROM events WHERE town_id=? AND (synced_to IS NULL OR synced_to<>?) ORDER BY rowid LIMIT ?').all(town_id,pendingFor,limit) : this.db.prepare('SELECT payload,synced_to FROM events WHERE town_id=? ORDER BY rowid LIMIT ?').all(town_id,limit);
    return rows.map(r=>({...JSON.parse(r.payload),synced_to:r.synced_to}));
  }
  claim(town_id,user_id) {
    this.db.prepare('INSERT OR IGNORE INTO owners VALUES(?,?)').run(town_id,user_id);
    return this.db.prepare('SELECT user_id FROM owners WHERE town_id=?').get(town_id).user_id===user_id;
  }
  ack(ids,user_id) { for(const id of ids)this.db.prepare('UPDATE events SET synced_to=? WHERE id=?').run(user_id,id); }
  close(){this.db.close();}
}
module.exports={GameplayDB};
