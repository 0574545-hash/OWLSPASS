/**
 * Folds dist/ into one self-contained HTML file: styles, script and fonts
 * inlined, no network needed. Open it by double-clicking.
 *
 *   npm run standalone
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const OUT = process.argv[2] ?? 'Аква пати — CRM.html'
/** «clean» собирает файл, который открывается с пустой кассой. */
const MODE = process.argv[3] === 'clean' ? 'clean' : 'demo'

const assets = readdirSync(join(DIST, 'assets'))
const cssName = assets.find((f) => f.endsWith('.css'))
const jsName = assets.find((f) => f.endsWith('.js'))
if (!cssName || !jsName) throw new Error('Сначала соберите проект: npm run build')

let css = readFileSync(join(DIST, 'assets', cssName), 'utf8')
const js = readFileSync(join(DIST, 'assets', jsName), 'utf8')

// Fonts are referenced from the stylesheet as ./FontName-hash.woff2 — swap
// each for a data: URI so the file carries its own typography.
let inlined = 0
css = css.replace(/url\((?:"|')?\.\/([^)"']+\.woff2)(?:"|')?\)/g, (whole, file) => {
  try {
    const b64 = readFileSync(join(DIST, 'assets', file)).toString('base64')
    inlined += 1
    return `url(data:font/woff2;base64,${b64})`
  } catch {
    return whole
  }
})

const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Аква пати · CRM</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="app"></div>
${MODE === 'clean' ? '    <script>window.__AQUA_MODE__ = "clean"</script>\n' : ''}    <script type="module">${js}</script>
  </body>
</html>
`

writeFileSync(OUT, html)
const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
console.log(`Готово: ${OUT} — ${kb} КБ, шрифтов встроено: ${inlined}, данные: ${MODE === 'clean' ? 'пустая касса' : 'демо-смена'}`)
console.log('Файл самодостаточный: откройте его двойным щелчком, интернет не нужен.')
