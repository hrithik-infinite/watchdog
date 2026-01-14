import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

const sizes = [16, 32, 48, 128];

// Simple watchdog eye icon SVG
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#grad)"/>
  <ellipse cx="${size/2}" cy="${size/2}" rx="${size*0.35}" ry="${size*0.25}" fill="white"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.12}" fill="#1D4ED8"/>
  <circle cx="${size/2 + size*0.04}" cy="${size/2 - size*0.04}" r="${size*0.04}" fill="white"/>
</svg>
`;

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const size of sizes) {
    const svg = createSvg(size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));

    console.log(`Generated icon-${size}.png`);
  }

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
