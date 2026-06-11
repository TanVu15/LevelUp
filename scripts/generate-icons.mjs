// Sinh bộ icon PNG + favicon.ico từ public/icon-512.svg (feat-pwa-public-ready REQ-01).
// Chạy tay khi icon đổi: node scripts/generate-icons.mjs — output commit vào public/.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const svg = readFileSync('public/icon-512.svg', 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();

async function renderPng(size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>*{margin:0;padding:0}</style><img src="${dataUrl}" width="${size}" height="${size}">`,
    { waitUntil: 'networkidle' },
  );
  const buf = await page.screenshot({ type: 'png' }); // SVG gốc full-bleed nền → không cần transparency
  await page.close();
  return buf;
}

// ICO chứa 1 entry PNG 32×32 (hợp lệ từ Vista/IE9+; mọi browser hiện đại đọc được).
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2);       // palette
  entry.writeUInt8(0, 3);       // reserved
  entry.writeUInt16LE(1, 4);    // color planes
  entry.writeUInt16LE(32, 6);   // bits per pixel
  entry.writeUInt32LE(png.length, 8);  // data size
  entry.writeUInt32LE(22, 12);         // data offset (6 + 16)
  return Buffer.concat([header, entry, png]);
}

const out = [
  ['public/icon-512.png', 512],
  ['public/icon-192.png', 192],
  ['public/apple-touch-icon.png', 180],
  ['public/favicon-32.png', 32],
];
for (const [file, size] of out) {
  writeFileSync(file, await renderPng(size));
  console.log('wrote', file);
}
writeFileSync('public/favicon.ico', pngToIco(readFileSync('public/favicon-32.png'), 32));
console.log('wrote public/favicon.ico');

await browser.close();
