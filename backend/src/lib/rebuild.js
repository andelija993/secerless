// The public site is static, so content edits only go live after a rebuild. When NETLIFY_BUILD_HOOK
// is set, trigger one after admin changes — debounced so a burst of edits costs a single build.
const DELAY_MS = 60_000;
let timer = null;

export function scheduleRebuild() {
  const hook = process.env.NETLIFY_BUILD_HOOK;
  if (!hook) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    fetch(hook, { method: 'POST' })
      .then((res) => console.log(`Site rebuild triggered (${res.status})`))
      .catch((err) => console.error('Site rebuild trigger failed', err));
  }, DELAY_MS);
}

