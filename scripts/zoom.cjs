const { chromium } = require('/Users/yh/.workbuddy-ai/binaries/node/workspace/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 3 })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const btn = page.getByRole('button', { name: /使用演示档案进入/ })
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(900) }
  await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const card = page.locator('.tl-card').first()
  await card.screenshot({ path: '/tmp/zj/z-card.png' })
  const box = await page.locator('.tl-card').first().locator('.num').first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { w: r.width, h: r.height, text: el.textContent, white: getComputedStyle(el).whiteSpace }
  })
  console.log(JSON.stringify(box))
  await browser.close()
})()
