/**
 * Goldstone Arena - Static Build Script
 * Merges partial sections into a standalone HTML file in `dist/index.html`
 * for static hosting (e.g. GitHub Pages, Vercel, Netlify) or offline viewing.
 */

const fs = require('fs');
const path = require('path');

const srcIndex = path.join(__dirname, 'index.html');
const distDir = path.join(__dirname, 'dist');
const distIndex = path.join(distDir, 'index.html');

let html = fs.readFileSync(srcIndex, 'utf-8');

// Replace all data-include placeholders with section content
const includeRegex = /<div\s+data-include="([^"]+)"><\/div>/g;
html = html.replace(includeRegex, (match, filepath) => {
  const fullPath = path.join(__dirname, filepath);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Inlined ${filepath}`);
    return fs.readFileSync(fullPath, 'utf-8');
  } else {
    console.warn(`⚠ Missing file: ${filepath}`);
    return match;
  }
});

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(distIndex, html, 'utf-8');
console.log(`\n🎉 Build complete: ${distIndex}`);

