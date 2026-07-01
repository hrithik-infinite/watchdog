import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

const sizes = [16, 32, 48, 128];

// "Icon 2b" — the solid hound silhouette from the Claude Design logo notebook.
// One evenodd path: the head outline plus three subpath circles (eyes + nose)
// that punch true holes. Authored in a 24-unit grid (same as the source mark).
const HOUND_2B =
  'M6.5 8.8 L4.5 3.1 L10.2 6.1 L13.8 6.1 L19.5 3.1 L17.5 8.8 C18.7 11 18.6 13.9 16.9 16.1 C15.5 17.9 13.9 19.2 12 19.2 C10.1 19.2 8.5 17.9 7.1 16.1 C5.4 13.9 5.3 11 6.5 8.8 Z M8.45 12.4 a1.15 1.15 0 1 0 2.3 0 a1.15 1.15 0 1 0 -2.3 0 Z M13.25 12.4 a1.15 1.15 0 1 0 2.3 0 a1.15 1.15 0 1 0 -2.3 0 Z M10.65 15.2 a1.35 1.35 0 1 0 2.7 0 a1.35 1.35 0 1 0 -2.7 0 Z';

// App icon: a dark hound on the brand #3D9BFF rounded tile. The dog (24-grid)
// is scaled x5 and centred on the 128 canvas.
const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#3D9BFF"/>
  <path transform="translate(4 8) scale(5)" fill="#06121F" fill-rule="evenodd" d="${HOUND_2B}"/>
</svg>`;

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const size of sizes) {
    // Rasterise the 128px master at high density, then resize down so the small
    // icons (16px Chrome toolbar) stay crisp.
    await sharp(Buffer.from(APP_ICON_SVG), { density: 384 })
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));

    console.log(`Generated icon-${size}.png`);
  }

  console.log('All icons generated!');
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
