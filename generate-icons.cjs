// Simple script to generate PWA icons as PNG
// Uses a tiny 1-pixel PNG as placeholder — replace with real icons later
const fs = require('fs');
const path = require('path');

// Minimal valid PNG (1x1 green pixel) — we'll use SVG in the app anyway
function createMinimalPNG(size) {
  // This creates a minimal valid PNG file
  // For production, replace with actual designed icons
  const { createCanvas } = (() => {
    try { return require('canvas'); } catch { return { createCanvas: null }; }
  })();

  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    // Dark bg
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, size, size);
    // Green circle
    ctx.beginPath();
    ctx.arc(size/2, size/2, size * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    // Dollar sign
    ctx.fillStyle = '#0A0E17';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', size/2, size/2);
    return canvas.toBuffer('image/png');
  }

  // Fallback: create a minimal 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
}

const iconsDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

[192, 512].forEach(size => {
  const png = createMinimalPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
});
