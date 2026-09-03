/**
 * Same bundle as standalone, but without the outer <html>/<head>/<body>:
 * пригодно для публикации страницей-артефактом.
 *
 *   node scripts/bundle-artifact.mjs <файл> [clean]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const OUT = process.argv[2] ?? 'artifact.html'
const MODE = process.argv[3] === 'clean' ? 'clean' : 'demo'

const assets = readdirSync(join(DIST, 'assets'))
const cssName = assets.find((f) => f.endsWith('.css'))
const jsName = assets.find((f) => f.endsWith('.js'))
if (!cssName || !jsName) throw new Error('Сначала соберите проект: npm run build')

let css = readFileSync(join(DIST, 'assets', cssName), 'utf8')
const js = readFileSync(join(DIST, 'assets', jsName), 'utf8')
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

const title = MODE === 'clean' ? 'Аква пати · Касса' : 'Аква пати · Демо-смена'
const html = `<title>${title}</title>
<style>${css}</style>
<div id="app"></div>
${MODE === 'clean' ? '<script>window.__AQUA_MODE__ = "clean"</script>\n' : ''}<script type="module">${js}</script>
`
writeFileSync(OUT, html)
console.log(`Готово: ${OUT} — ${(Buffer.byteLength(html) / 1024).toFixed(0)} КБ, шрифтов: ${inlined}, данные: ${MODE === 'clean' ? 'пустая касса' : 'демо-смена'}`)
