// Draws the abstract app icon (an open book shape on a teal square) as PNG files.
// Run once with: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const TEAL = [31, 95, 91], WHITE = [255, 255, 255], SOFT = [227, 239, 237];
// Two pages of an open book, inside the safe zone for maskable icons.
function pixel(x, y) {
  const inPage = (x0, x1) => x >= x0 && x <= x1 && y >= 0.32 && y <= 0.68;
  if (inPage(0.24, 0.48) || inPage(0.52, 0.76)) {
    // lines on the pages
    const line = [0.41, 0.5, 0.59].some((ly) => Math.abs(y - ly) < 0.012) && ((x > 0.28 && x < 0.44) || (x > 0.56 && x < 0.72));
    return line ? TEAL : x < 0.5 ? WHITE : SOFT;
  }
  return TEAL;
}
writeFileSync('public/icon-192.png', png(192, pixel));
writeFileSync('public/icon-512.png', png(512, pixel));
console.log('icons written');
