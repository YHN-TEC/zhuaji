const { chromium } = require('/Users/yh/.workbuddy-ai/binaries/node/workspace/node_modules/playwright-core')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://127.0.0.1:5180'
const OUT = '/tmp/zj'

async function run() {
  const fs = require('fs')
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const logs = []

  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') logs.push('CONSOLE ' + m.text()) })
  page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message))

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/d-login.png` })

  await page.getByRole('button', { name: /使用演示档案进入/ }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/d-home.png`, fullPage: true })

  for (const [name, path] of [['profile', '/profile'], ['timeline', '/timeline'], ['health', '/health'], ['local', '/local'], ['settings', '/settings']]) {
    await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/d-${name}.png`, fullPage: true })
  }

  // 快捷记录：打开、填写、保存
  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: '记录' }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/d-record.png` })
  await page.locator('#w').fill('6.1')
  await page.getByRole('button', { name: '保存记录' }).click()
  await page.waitForTimeout(1100)
  await page.screenshot({ path: `${OUT}/d-record-done.png` })
  await page.getByRole('button', { name: '分享这次记录' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/d-share.png` })
  await page.locator('label').filter({ hasText: '同城可见' }).click()
  await page.getByRole('button', { name: '确认分享' }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/d-after-share.png` })

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const mp = await mctx.newPage()
  mp.on('pageerror', (e) => logs.push('M-PAGEERROR ' + e.message))
  await mp.goto(BASE, { waitUntil: 'networkidle' })
  await mp.waitForTimeout(900)
  await mp.screenshot({ path: `${OUT}/m-login.png` })
  await mp.getByRole('button', { name: /使用演示档案进入/ }).click()
  await mp.waitForTimeout(1200)
  await mp.screenshot({ path: `${OUT}/m-home.png`, fullPage: true })
  for (const [name, path] of [['profile', '/profile'], ['timeline', '/timeline'], ['health', '/health'], ['local', '/local']]) {
    await mp.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle' })
    await mp.waitForTimeout(600)
    await mp.screenshot({ path: `${OUT}/m-${name}.png`, fullPage: true })
  }
  await mp.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
  await mp.waitForTimeout(400)
  await mp.locator('.fab').click()
  await mp.waitForTimeout(500)
  await mp.screenshot({ path: `${OUT}/m-record.png` })

  // 溢出检测
  const overflow = await mp.evaluate(() => {
    const bad = []
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
        bad.push({ tag: el.tagName, cls: el.className && String(el.className).slice(0, 40), right: Math.round(r.right) })
      }
    })
    return bad.slice(0, 12)
  })
  logs.push('MOBILE OVERFLOW: ' + JSON.stringify(overflow))

  const overflowD = await page.evaluate(() => {
    const bad = []
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
        bad.push({ tag: el.tagName, cls: el.className && String(el.className).slice(0, 40), right: Math.round(r.right) })
      }
    })
    return bad.slice(0, 12)
  })
  logs.push('DESKTOP OVERFLOW: ' + JSON.stringify(overflowD))

  console.log(logs.join('\n'))
  await browser.close()
}

run().catch((e) => {
  console.error('FAILED', e)
  process.exit(1)
})
