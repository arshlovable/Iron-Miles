/**
 * Extracts the photographic backgrounds from the approved design reference
 * into optimized WebP assets. Coordinates are in the 682x1024 reference image.
 *
 * Usage: node scripts/crop-design-assets.mjs <path-to-design-image>
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'src', 'assets', 'design');
const publicDir = path.join(__dirname, '..', 'public');

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/crop-design-assets.mjs <path-to-design-image>');
  process.exit(1);
}

const crops = [
  { name: 'hero-truck', left: 462, top: 36, width: 220, height: 160, scale: 4 },
  { name: 'founder-silhouette', left: 290, top: 316, width: 220, height: 124, scale: 4 },
  { name: 'discipline-truck', left: 0, top: 862, width: 245, height: 162, scale: 4 },
];

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

for (const c of crops) {
  const out = path.join(outDir, `${c.name}.webp`);
  await sharp(source)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .resize(c.width * c.scale, c.height * c.scale, { kernel: 'lanczos3' })
    .modulate({ saturation: 1.05 })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 82 })
    .toFile(out);
  console.log('wrote', path.relative(process.cwd(), out));
}

await sharp(source)
  .extract({ left: 462, top: 60, width: 220, height: 116 })
  .resize(1200, 630, { fit: 'cover', kernel: 'lanczos3' })
  .sharpen({ sigma: 0.8 })
  .jpeg({ quality: 82 })
  .toFile(path.join(publicDir, 'og-image.jpg'));
console.log('wrote public/og-image.jpg');
