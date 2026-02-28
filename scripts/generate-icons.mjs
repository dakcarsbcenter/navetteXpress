import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Ensure icons/ directory exists
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// SVG icon template — dark background + gold "N"
function makeSvg(size) {
    const radius = Math.round(size * 0.15);
    const fontSize = Math.round(size * 0.65);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0a0a0a"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Georgia,serif" font-weight="700" font-size="${fontSize}" fill="#C9A84C">N</text>
</svg>`;
}

// Write SVG source files
const sizes = [16, 32, 180];
for (const s of sizes) {
    const dest = path.join(iconsDir, `icon-${s}.svg`);
    fs.writeFileSync(dest, makeSvg(s));
    console.log(`✓ Written ${dest}`);
}

// Try to convert to PNG using sharp (if available)
let sharp;
try {
    sharp = (await import('sharp')).default;
} catch {
    console.log('\nℹ  sharp is not installed — skipping PNG conversion.');
    console.log('  Run: npm install --save-dev sharp');
    console.log('  Then re-run this script.\n');
    process.exit(0);
}

for (const s of sizes) {
    const src = path.join(iconsDir, `icon-${s}.svg`);
    const dest = path.join(iconsDir, `icon-${s}.png`);
    await sharp(Buffer.from(makeSvg(s))).resize(s, s).png().toFile(dest);
    console.log(`✓ PNG: ${dest}`);
}

// favicon.ico (32x32 PNG saved as .ico — modern browsers accept this)
const faviconDest = path.join(publicDir, 'favicon.ico');
await sharp(Buffer.from(makeSvg(32))).resize(32, 32).png().toFile(faviconDest);
console.log(`✓ Favicon: ${faviconDest}`);

// apple-touch-icon
const appleDest = path.join(iconsDir, 'apple-touch-icon.png');
await sharp(Buffer.from(makeSvg(180))).resize(180, 180).png().toFile(appleDest);
console.log(`✓ Apple touch icon: ${appleDest}`);

console.log('\n✅ All icons generated successfully!');
