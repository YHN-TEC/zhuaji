const { chromium } = require('/Users/yh/.workbuddy-ai/binaries/node/workspace/node_modules/playwright-core')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180'
const OUT = '/tmp/zj'

;(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 } })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(BASE, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  await p.getByRole('button', { name: /使用演示档案进入/ }).click()
  await p.waitForTimeout(1000)

  // 404
  await p.goto(`${BASE}/#/nope`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/q-404.png` })

  // 刷新后数据是否保留
  await p.goto(`${BASE}/#/health`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.reload({ waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  const hasChart = await p.locator('.chart-svg').count()
  const petName = await p.locator('.side-pet').innerText()

  // 导出摘要弹层
  await p.getByRole('button', { name: /导出摘要/ }).first().click()
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${OUT}/q-export.png` })
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)

  // 分享卡弹层（成长卡）
  await p.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.getByRole('button', { name: /成长卡/ }).first().click()
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${OUT}/q-review.png` })

  console.log(JSON.stringify({ errs, hasChart, petName }))
  await browser.close()
})()
