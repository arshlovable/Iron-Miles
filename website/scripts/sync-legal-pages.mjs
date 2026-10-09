/**
 * Regenerate legal/support HTML from frontend and copy into website/public/.
 * Run from repo after privacyPolicyContent.json changes: npm run sync-legal-pages
 * Vercel builds only use website/public/ (Vite copies it to dist) — no frontend at build time.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.join(__dirname, '..');
const frontendRoot = path.join(websiteRoot, '..', 'frontend');
const websitePublic = path.join(websiteRoot, 'public');

if (!existsSync(path.join(frontendRoot, 'scripts', 'generate-privacy-pages.mjs'))) {
  console.error('frontend/ not found — run this from the monorepo with frontend checked out.');
  process.exit(1);
}

const result = spawnSync('node', ['scripts/generate-privacy-pages.mjs'], {
  cwd: frontendRoot,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

const frontendPublic = path.join(frontendRoot, 'public');
for (const dir of ['privacypolicy', 'privacy', 'support', 'delete-account', 'deleteaccount']) {
  const src = path.join(frontendPublic, dir);
  if (!existsSync(src)) continue;
  const dest = path.join(websitePublic, dir);
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log('synced', dir, '→ website/public/' + dir);
}
