const { chromium } = require('/Users/yh/.workbuddy-ai/binaries/node/workspace/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180'
const OUT = '/tmp/zj'

const pages = ['/', '/profile', '/timeline', '/health', '/local', '/messages', '/settings']

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const report = []

  for (const width of [360, 390, 768]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 2, isMobile: width < 768, hasTouch: true })
    const p = await ctx.newPage()
    await p.goto(BASE, { waitUntil: 'networkidle' })
    await p.waitForTimeout(500)
    const demo = p.getByRole('button', { name: /使用演示档案进入/ })
    if (await demo.count()) { await demo.click(); await p.waitForTimeout(1000) }
    for (const path of pages) {
      await p.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' })
      await p.waitForTimeout(450)
      const bad = await p.evaluate(() => {
        const out = []
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
            out.push((el.className && String(el.className).slice(0, 30)) || el.tagName)
          }
          if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.children.length === 0) {
            out.push('TEXT_OVERFLOW:' + (el.textContent || '').slice(0, 16))
          }
        })
        return [...new Set(out)].slice(0, 8)
      })
      report.push({ width, path, bad })
      if (width === 360 && (path === '/' || path === '/timeline')) {
        await p.screenshot({ path: `${OUT}/w360-${path === '/' ? 'home' : 'timeline'}.png`, fullPage: true })
      }
    }
    await ctx.close()
  }

  console.log(JSON.stringify(report.filter((r) => r.bad.length), null, 1) || 'clean')
  await browser.close()
})()
