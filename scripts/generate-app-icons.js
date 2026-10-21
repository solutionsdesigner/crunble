import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to write a valid opaque PNG with Node.js built-in zlib
function createPngBuffer(width, height, drawPixel) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Color type 2: Truecolor (RGB, opaque for iOS App Store)
  ihdr.writeUInt8(0, 10); // Compression method (deflate)
  ihdr.writeUInt8(0, 11); // Filter method
  ihdr.writeUInt8(0, 12); // Interlace method (none)

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image scanlines: filter byte (0) + RGB triplets per row
  const rowLength = 1 + width * 3;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table & calculator
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Cronble Icon Design:
// Elegant deep graphite background with warm timeline track and golden/amber chronological progress orb
function drawCronbleIcon(x, y, width, height) {
  // Normalize coordinates [-1, 1]
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Base background: Luxurious obsidian dark gradient (#121316 to #1a1c23)
  const bgGrad = 0.5 + 0.5 * ny;
  let r = Math.round(18 + bgGrad * 6);
  let g = Math.round(19 + bgGrad * 8);
  let b = Math.round(23 + bgGrad * 12);

  // Outer timeline ring track (radius ~0.65, thickness 0.05)
  const ringDist = Math.abs(dist - 0.62);
  if (ringDist < 0.045) {
    const ringAlpha = 1 - ringDist / 0.045;
    r = Math.round(r * (1 - ringAlpha) + 60 * ringAlpha);
    g = Math.round(g * (1 - ringAlpha) + 62 * ringAlpha);
    b = Math.round(b * (1 - ringAlpha) + 70 * ringAlpha);
  }

  // Active progression arc on the right/top side (angle between -90deg and +45deg)
  const angle = Math.atan2(ny, nx); // radians -PI to PI
  const isArc = ringDist < 0.048 && angle >= -Math.PI * 0.75 && angle <= Math.PI * 0.35;
  if (isArc) {
    const arcAlpha = 1 - ringDist / 0.048;
    // Amber gold highlight (#d97706 / #f59e0b)
    r = Math.round(r * (1 - arcAlpha) + 245 * arcAlpha);
    g = Math.round(g * (1 - arcAlpha) + 158 * arcAlpha);
    b = Math.round(b * (1 - arcAlpha) + 11 * arcAlpha);
  }

  // Focal progress indicator dot at angle ~ 0.35 rad on the ring
  const dotX = Math.cos(Math.PI * 0.35) * 0.62;
  const dotY = Math.sin(Math.PI * 0.35) * 0.62;
  const dotDist = Math.sqrt((nx - dotX) * (nx - dotX) + (ny - dotY) * (ny - dotY));
  if (dotDist < 0.11) {
    const dotAlpha = Math.max(0, 1 - dotDist / 0.11);
    r = Math.round(r * (1 - dotAlpha) + 255 * dotAlpha);
    g = Math.round(g * (1 - dotAlpha) + 235 * dotAlpha);
    b = Math.round(b * (1 - dotAlpha) + 180 * dotAlpha);
  }

  // Central Minimalist Stylized 'C' Timeline Monogram
  const innerRingDist = Math.abs(dist - 0.32);
  const openAngle = angle > -0.6 && angle < 0.6; // Gap for 'C' opening
  if (innerRingDist < 0.055 && !openAngle) {
    const cAlpha = 1 - innerRingDist / 0.055;
    r = Math.round(r * (1 - cAlpha) + 245 * cAlpha);
    g = Math.round(g * (1 - cAlpha) + 240 * cAlpha);
    b = Math.round(b * (1 - cAlpha) + 230 * cAlpha);
  }

  // Center subtle active pulse point
  if (dist < 0.065) {
    const coreAlpha = 1 - dist / 0.065;
    r = Math.round(r * (1 - coreAlpha) + 217 * coreAlpha);
    g = Math.round(g * (1 - coreAlpha) + 119 * coreAlpha);
    b = Math.round(b * (1 - coreAlpha) + 6 * coreAlpha);
  }

  return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b))];
}

// Required iOS Sizes
const ICON_SPECS = [
  { size: 1024, name: 'icon-1024.png', idiom: 'ios-marketing', scale: '1x' },
  { size: 180, name: 'icon-60@3x.png', idiom: 'iphone', scale: '3x', sizeStr: '60x60' },
  { size: 120, name: 'icon-60@2x.png', idiom: 'iphone', scale: '2x', sizeStr: '60x60' },
  { size: 120, name: 'icon-40@3x.png', idiom: 'iphone', scale: '3x', sizeStr: '40x40' },
  { size: 80, name: 'icon-40@2x.png', idiom: 'iphone', scale: '2x', sizeStr: '40x40' },
  { size: 87, name: 'icon-29@3x.png', idiom: 'iphone', scale: '3x', sizeStr: '29x29' },
  { size: 58, name: 'icon-29@2x.png', idiom: 'iphone', scale: '2x', sizeStr: '29x29' },
  { size: 60, name: 'icon-20@3x.png', idiom: 'iphone', scale: '3x', sizeStr: '20x20' },
  { size: 40, name: 'icon-20@2x.png', idiom: 'iphone', scale: '2x', sizeStr: '20x20' },
  { size: 167, name: 'icon-83.5@2x.png', idiom: 'ipad', scale: '2x', sizeStr: '83.5x83.5' },
  { size: 152, name: 'icon-76@2x.png', idiom: 'ipad', scale: '2x', sizeStr: '76x76' },
  { size: 76, name: 'icon-76.png', idiom: 'ipad', scale: '1x', sizeStr: '76x76' },
  { size: 40, name: 'icon-40.png', idiom: 'ipad', scale: '1x', sizeStr: '40x40' },
  { size: 29, name: 'icon-29.png', idiom: 'ipad', scale: '1x', sizeStr: '29x29' },
  { size: 20, name: 'icon-20.png', idiom: 'ipad', scale: '1x', sizeStr: '20x20' },
];

export function generateAllIcons(outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating Cronble iOS App Store & Native Icons in: ${outputDir}`);

  for (const spec of ICON_SPECS) {
    const buf = createPngBuffer(spec.size, spec.size, drawCronbleIcon);
    const dest = path.join(outputDir, spec.name);
    fs.writeFileSync(dest, buf);
    console.log(`✓ Generated ${spec.name} (${spec.size}x${spec.size}px)`);
  }

  // Generate Xcode Contents.json
  const contentsJson = {
    images: ICON_SPECS.map((spec) => ({
      size: spec.sizeStr || `${spec.size}x${spec.size}`,
      idiom: spec.idiom,
      filename: spec.name,
      scale: spec.scale,
    })),
    info: {
      version: 1,
      author: 'xcode',
    },
  };

  fs.writeFileSync(
    path.join(outputDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('✓ Generated Contents.json for Xcode AppIcon.appiconset');
}

// Execute if run directly
const targetDir = process.argv[2] || path.resolve(process.cwd(), 'resources/icons');
generateAllIcons(targetDir);
