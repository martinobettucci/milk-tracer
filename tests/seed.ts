// Deterministic sample feeds seeded into IndexedDB so charts render in
// screenshots. Runs inside the browser via page.evaluate, seeding through the
// app's own Dexie instance (exposed as window.milkDb) to avoid version races.
export const SEED_FN = `
async () => {
  // Wait until the app has initialised its Dexie handle.
  for (let i = 0; i < 100 && !window.milkDb; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const db = window.milkDb;
  if (!db) throw new Error('milkDb not ready');
  await db.feeds.clear();

  // Anchor to the real current time so "today" KPIs and the next-feed
  // recommendation are populated. Timestamps walk backwards from now.
  const now = Date.now();
  const DAY = 86400000, HR = 3600000;
  const small = [30,60,90,120,150], big = [60,120,180,240];
  const fracs = [0.25,0.5,0.75,1];
  const rnd = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };

  const feeds = [];
  let s = 1;
  // 4 days, 7 feeds/day, roughly every 3h; day 0 = today (up to now).
  for (let d = 3; d >= 0; d--) {
    for (let i = 0; i < 7; i++) {
      const type = rnd(s++) > 0.5 ? 'big' : 'small';
      const sizes = type === 'big' ? big : small;
      const sizeMl = sizes[Math.floor(rnd(s++) * sizes.length)];
      const fraction = fracs[Math.floor(rnd(s++) * fracs.length)];
      const drunkMl = Math.round(sizeMl * fraction);
      const ts = now - d*DAY - i*3*HR - Math.floor(rnd(s++)*HR) - HR;
      feeds.push({ timestamp: ts, bottleType: type, sizeMl, fraction, drunkMl, wastedMl: sizeMl - drunkMl });
    }
  }
  await db.feeds.bulkAdd(feeds);
  return feeds.length;
}
`
