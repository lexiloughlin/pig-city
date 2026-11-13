// Offline event database shared by the browser and desktop recorder.
(function(root) {
  'use strict';
  class BrowserStore {
    constructor(indexedDB = root.indexedDB) {
      this.ready = new Promise((resolve, reject) => {
        const req = indexedDB.open('pigcity-gameplay', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('events', { keyPath: 'id' }).createIndex('town', 'town_id');
          db.createObjectStore('owners', { keyPath: 'town_id' });
        };
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('Close other Pig City tabs to open the gameplay database.'));
        req.onsuccess = () => resolve(req.result);
      });
    }
    async transaction(stores, mode, run) {
      const db = await this.ready;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(stores, mode); let result;
        tx.oncomplete = () => resolve(result);
        tx.onerror = tx.onabort = () => reject(tx.error || new Error('Gameplay database transaction failed'));
        run(tx, value => { result = value; });
      });
    }
    put(events) {
      return this.transaction(['events'], 'readwrite', tx => {
        const store = tx.objectStore('events');
        for (const event of events) {
          const req = store.get(event.id);
          req.onsuccess = () => {
            if (!req.result) store.add({ ...event, synced_to: null });
            else if (!/^(snapshot|register)\//.test(event.id) && root.GameplayTracking.canonical(strip(req.result)) !== root.GameplayTracking.canonical(event)) tx.abort();
          };
        }
      });
    }
    claim(town_id, user_id) {
      return this.transaction(['owners'], 'readwrite', (tx, done) => {
        const store = tx.objectStore('owners'), req = store.get(town_id);
        req.onsuccess = () => {
          if (req.result && req.result.user_id !== user_id) { done(false); return; }
          store.put({town_id, user_id}); done(true);
        };
      });
    }
    rows(town_id, pendingFor = null, limit = Infinity) {
      return this.transaction(['events'], 'readonly', (tx, done) => {
        const result = [], req = tx.objectStore('events').index('town').openCursor(root.IDBKeyRange.only(town_id));
        req.onsuccess = () => {
          const cur = req.result;
          if (!cur || result.length >= limit) { done(result); return; }
          if (!pendingFor || cur.value.synced_to !== pendingFor) result.push(cur.value);
          cur.continue();
        };
      });
    }
    ack(ids, user_id) {
      return this.transaction(['events'], 'readwrite', tx => {
        const store = tx.objectStore('events');
        for (const id of ids) { const req = store.get(id); req.onsuccess = () => { if (req.result) store.put({...req.result, synced_to: user_id}); }; }
      });
    }
  }
  const strip = row => { const {synced_to, ...event} = row; return event; };
  const api = {BrowserStore, strip};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GameplayStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
