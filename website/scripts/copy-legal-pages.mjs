/**
 * After the Vite build, copy static legal/support pages from the Expo app
 * so ironmiles.app/privacypolicy and /support keep working (App Store / Play links).
 * Does not modify frontend source — only runs the existing generator and copies output.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.join(__dirname, '..');
const repoRoot = path.join(websiteRoot, '..');
const frontendRoot = path.join(repoRoot, 'frontend');
const distRoot = path.join(websiteRoot, 'dist');

const result = spawnSync('node', ['scripts/generate-privacy-pages.mjs'], {
  cwd: frontendRoot,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

const publicRoot = path.join(frontendRoot, 'public');
for (const dir of ['privacypolicy', 'privacy', 'support', 'delete-account', 'deleteaccount']) {
  const src = path.join(publicRoot, dir);
  if (!existsSync(src)) continue;
  cpSync(src, path.join(distRoot, dir), { recursive: true });
  console.log('copied', dir, '→ dist/' + dir);
}
