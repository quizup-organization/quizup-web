import { createRequire } from "node:module"
const require = createRequire(
  "/Users/nadjim/Homeware/quizup-workspace/web-applications/quizup-web/package.json"
)
const { chromium } = require("@playwright/test")
const dir = "/private/var/folders/m_/swf7ly8j7nx4vv3n_6lchw_r0000gn/T/opencode"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 420 } })
await page.goto(`file://${dir}/dark-tokens.html`)
await page.waitForTimeout(250)
await page.locator("#shot").screenshot({ path: `${dir}/tokens-light.png` })
await page.evaluate(() => document.documentElement.classList.add("dark"))
await page.evaluate(() => {
  document.getElementById("label").textContent =
    "Motif tuile 280 px — thème SOMBRE (nuances WhatsApp)"
})
await page.waitForTimeout(250)
await page.locator("#shot").screenshot({ path: `${dir}/tokens-dark.png` })
await browser.close()
console.log("ok")
