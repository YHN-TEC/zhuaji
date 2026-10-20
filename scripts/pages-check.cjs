const { chromium } = require('/Users/yh/.workbuddy-ai/binaries/node/workspace/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:8099/zhuaji/'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  const bad = []
  p.on('pageerror', (e) => bad.push('PAGEERROR ' + e.message))
  p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`) })
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.getByRole('button', { name: /使用演示档案进入/ }).click()
  await p.waitForTimeout(1200)
  const imgOk = await p.evaluate(() =>
    [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })),
  )
  await p.screenshot({ path: '/tmp/zj/pages-home.png' })
  await p.goto(BASE + '#/local', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.screenshot({ path: '/tmp/zj/pages-local.png' })
  console.log(JSON.stringify({ bad, broken: imgOk.filter((i) => !i.ok) }, null, 1))
  await browser.close()
})()
