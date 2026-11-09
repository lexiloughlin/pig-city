// Pig City cloud saves (web version). Signed-in players get their town saved to Supabase every
// 30 seconds and can pick it up in any browser. Signed out, the game saves on the device as before.
// The Mac app blocks all network access, so this does nothing there (see docs/SANDBOX_AUDIT.md).
(() => {
  'use strict';
  const T = window.pigTown;
  if (!T || window.pigDesktop) return;
  const SUPABASE_URL = 'https://mrbmybiwxayhhneixdgc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ftYMUq_X7eiDnKXDb3ac6Q_uZ7Mgbi8'; // publishable: safe in the page, row-level security guards the data
  const LINK_KEY = 'pigcity-cloud'; // which cloud town this browser plays, and the version it last saved
  const $ = id => document.getElementById(id);

  let sb = null, user = null, link = null, lastSent = null, savedAt = 0, busy = false, status = '';
  let leaving = false; // a cloud town is loading: the old town on screen must not be saved over it
  try { link = JSON.parse(localStorage.getItem(LINK_KEY) || 'null'); } catch (e) {}
  const setLink = l => { link = l; try { if (l) localStorage.setItem(LINK_KEY, JSON.stringify(l)); else localStorage.removeItem(LINK_KEY); } catch (e) {} };
  const linked = () => user && link && link.user === user.id;
  // a town saved by a newer Pig City is open read-only: never upload it from here (older games lack these hooks)
  const locked = () => !!(T.readOnly && T.readOnly());

  function ago(t) {
    const s = (Date.now() - new Date(t).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return new Date(t).toLocaleDateString();
  }
  function render() {
    $('cloudBtn').textContent = user ? '☁️ Signed in' : '☁️ Cloud save';
    $('cloudStatus').textContent =
      !user ? 'Sign in to keep your town safe in the cloud and play it in any browser.' :
      status === 'saving' ? 'Saving to the cloud…' :
      status === 'offline' ? 'Offline. Your town is saved here and goes to the cloud when you reconnect.' :
      status === 'error' ? 'Cloud save failed. Trying again soon.' :
      savedAt ? `Saved to the cloud ${ago(savedAt)} · ${user.email}` : `Signed in as ${user.email}`;
  }
  function fail(e) {
    status = navigator.onLine === false || /fetch|network/i.test(e && e.message || '') ? 'offline' : 'error';
    console.warn('cloud save', e); render();
  }

  // ---------- sign in / out ----------
  async function signIn() {
    const email = await T.askText('Your email for cloud saves. We will send you a sign-in link.', '', 80);
    if (!email || !email.trim()) return;
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) return T.tellBox('Could not send the sign-in link: ' + error.message);
    T.tellBox(`Check ${email.trim()} for a sign-in link and open it in this browser. Your town keeps saving here meanwhile.`);
  }
  async function menu() {
    if (!user) return signIn();
    if (!(await T.askYes(`Signed in as ${user.email}. Your town saves to the cloud every 30 seconds. Sign out?`, 'Sign out'))) return;
    await push();
    await sb.auth.signOut();
  }

  // ---------- syncing ----------
  // Runs after sign-in and on every page load while signed in: decide which town this browser plays.
  async function connect() {
    try {
      const { data: towns, error } = await sb.from('towns').select('id, name, version, updated_at, pig_count, building_count').order('updated_at', { ascending: false });
      if (error) throw error;
      const mine = link && link.user === user.id && towns.find(t => t.id === link.town);
      if (mine) { if (mine.version !== link.version) await conflict(mine); else render(); return; }
      if (towns.length) {
        const t = towns[0];
        if (await T.askYes(`You have a town in the cloud: ${t.name}, with ${t.pig_count} pigs and ${t.building_count} buildings, saved ${ago(t.updated_at)}. Play it here? Cancel keeps this browser's town and saves it to the cloud as a new town.`, 'Play cloud town')) return pull(t.id);
      }
      await create();
    } catch (e) { fail(e); }
  }
  async function create() {
    if (locked()) return;
    const text = T.text(), s = T.summary();
    const { data, error } = await sb.from('towns').insert({ player_id: user.id, name: s.name, state: JSON.parse(text), pig_count: s.pigs, building_count: s.buildings, coins: s.coins, device: 'web' }).select('id, version').single();
    if (error) {
      if (/town_limit/.test(error.message)) return T.tellBox('You already have 10 towns in the cloud, the most you can keep.');
      throw error;
    }
    setLink({ user: user.id, town: data.id, version: data.version });
    lastSent = text; savedAt = Date.now(); status = ''; render();
    T.toast('☁️ Your town is saved in the cloud!');
  }
  async function pull(id) {
    const { data, error } = await sb.from('towns').select('state, version').eq('id', id).single();
    if (error) throw error;
    if (!T.valid(data.state)) return T.tellBox("That cloud town couldn't be loaded.");
    if (T.tooNew && T.tooNew(data.state)) return T.tellBox('That cloud town was saved by a newer version of Pig City. Update the game to play it. The town on this device was not changed.');
    try { localStorage.setItem('pigcity-before-cloud', T.text()); } catch (e) {} // this browser's old town, just in case
    leaving = true;
    setLink({ user: user.id, town: id, version: data.version });
    T.use(JSON.stringify(data.state));
  }
  // Another device saved this town since this browser last did: let the player pick which to keep.
  // The copy that isn't kept stays in the town's save history.
  async function conflict(cloud) {
    if (!cloud) {
      const { data, error } = await sb.from('towns').select('id, version, updated_at, pig_count, building_count').eq('id', link.town).single();
      if (error) throw error;
      cloud = data;
    }
    const s = T.summary();
    const useCloud = await T.askYes(`Your town was saved on another device ${ago(cloud.updated_at)}, with ${cloud.pig_count} pigs and ${cloud.building_count} buildings. This browser has ${s.pigs} pigs and ${s.buildings} buildings. Use the cloud town? Cancel keeps this browser's town.`, 'Use cloud town');
    if (useCloud) return pull(cloud.id);
    setLink(Object.assign({}, link, { version: cloud.version }));
    await push(true);
  }
  async function push(force) {
    if (!linked() || busy || leaving || locked()) return;
    const text = T.text();
    if (text === lastSent && !force) return;
    const s = T.summary();
    busy = true; status = 'saving'; render();
    try {
      const { data, error } = await sb.rpc('save_town', {
        p_town_id: link.town, p_expected_version: link.version, p_state: JSON.parse(text),
        p_name: s.name, p_pig_count: s.pigs, p_building_count: s.buildings, p_coins: s.coins, p_device: 'web',
      });
      if (error) {
        busy = false;
        if (/^conflict/.test(error.message)) return conflict();
        if (/^not_found/.test(error.message)) { setLink(null); return connect(); } // deleted elsewhere: start over
        throw error;
      }
      setLink(Object.assign({}, link, { version: data }));
      lastSent = text; savedAt = Date.now(); status = '';
      render();
    } catch (e) { fail(e); } finally { busy = false; }
  }

  // ---------- start ----------
  const lib = document.createElement('script');
  lib.src = 'assets/vendor/supabase-2.118.0.js';
  lib.onload = () => {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    $('cloudBox').hidden = false;
    $('cloudBtn').addEventListener('click', menu);
    render();
    sb.auth.onAuthStateChange((event, session) => {
      const was = user && user.id;
      user = session ? session.user : null;
      render();
      // supabase-js asks that its own calls wait until this callback returns
      if (user && user.id !== was) setTimeout(connect, 0);
      if (!user) { status = ''; savedAt = 0; lastSent = null; }
    });
    setInterval(() => { push(); render(); }, 30000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) push(); });
    addEventListener('online', () => push(true));
  };
  document.head.appendChild(lib);
})();
