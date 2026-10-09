/**

 * Export Expo web and deploy the PWA to Vercel (use a separate domain such as app.ironmiles.app).
 * The marketing site at ironmiles.app is built from /website — see website/vercel.json.

 * Usage: node scripts/deploy-web.mjs

 *

 * Vercel project settings use Root Directory = "frontend". The CLI must deploy

 * from the repository root — deploying from frontend/ makes Vercel look for

 * frontend/frontend and fails with "Root Directory frontend does not exist".

 */

import { spawnSync } from 'node:child_process';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const frontendRoot = path.join(__dirname, '..');

const repoRoot = path.join(frontendRoot, '..');



function run(command, args, cwd) {

  const result = spawnSync(command, args, {

    cwd,

    stdio: 'inherit',

    shell: true,

    env: process.env,

  });

  if (result.status !== 0) {

    process.exit(result.status ?? 1);

  }

}



run('node', ['scripts/generate-privacy-pages.mjs'], frontendRoot);

run('npx', ['vercel', 'deploy', '--prod', '--yes'], repoRoot);


