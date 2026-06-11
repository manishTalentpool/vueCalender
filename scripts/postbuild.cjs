/**
 * GitHub Pages SPA fallback: serve index.html for unknown paths (history mode).
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'dist')
const index = path.join(dist, 'index.html')

if (!fs.existsSync(index)) {
  console.error('postbuild: dist/index.html not found — run build first')
  process.exit(1)
}

fs.copyFileSync(index, path.join(dist, '404.html'))
fs.writeFileSync(path.join(dist, '.nojekyll'), '')
console.log('postbuild: copied index.html → 404.html and added .nojekyll for GitHub Pages')
