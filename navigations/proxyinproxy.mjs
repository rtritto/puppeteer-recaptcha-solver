// process.env.DEBUG = 'puppeteer-extra,puppeteer-extra-plugin:*'

import path from 'node:path'
import url from 'node:url'
import _puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import UserPreferences from 'puppeteer-extra-plugin-user-preferences'
import ProxiesApi from 'free-proxy-generator'

import DeepbridApi from '../utils/DeepbridApi.mjs'
import fileUtils from '../utils/fileUtils.mjs'
import solve from '../index.mjs'
import configProxies from '../config/proxies.mjs'

// https://github.com/berstend/puppeteer-extra/issues/748
const puppeteer = _puppeteer.default

// import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'

// import { hookBlocker } from '../utils/adblockerUtils.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

puppeteer.use(StealthPlugin())
puppeteer.use(UserPreferences({
  // https://chromium.googlesource.com/chromium/src/+/master/chrome/common/pref_names.cc
  userPrefs: {
    download_restrictions: 0
    // 	webkit: { webprefs: { default_font_size: 22 } }
  }
}))
// puppeteer.use(AdblockerPlugin({
//   blockTrackers: true,
//   cacheDir: path.join(__dirname, '../extensions'),
//   useCache: true
// }))

// const pathExtensionUBlock = path.join(__dirname, '../extensions/uBlock-Origin-1.33.2')
const pathExtensionUBlock = path.join(__dirname, '../extensions/uBlock-Origin-1.43.0_40')

/**
 * @typedef {import('puppeteer').Browser} Browser
 * @typedef {import('puppeteer').Page} Page
 * @typedef {{
 *   host: string
 *   port: number
 *   code: string
 *   anonymity: string
 * }} Proxy
 */

/** @type {Browser} */
let browser
/** @type {Array<Proxy>} */
let proxies
// let nProxy = 31
let nProxy = 0
let TOTAL_PROXIES
const LINK = [
  'https://uptobox.com/<ID>'
  // 'http://www.easybytez.com/<ID>'
  // 'https://maxstream.video/d/<ID>'
]
const START = 'Deepbrid'

// process.on('SIGINT', () => {
// 	process.exit()
// })

/**
 * @param {Proxy} proxy
 * @return {Promise<Browser>}
 */
const launchBrowser = async (proxy) => {
  // Download browser particular version (TimeoutError)
  // const browserFetcher = puppeteer.createBrowserFetcher()
  // const revisionInfo = await browserFetcher.download('884014')

  return puppeteer.launch({
    executablePath: puppeteer.executablePath(),
    headless: false,
    // devtools: true,
    // defaultViewport: null,
    // ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${pathExtensionUBlock}`, `--load-extension=${pathExtensionUBlock}`,
      //'--window-size=650,700',
      //'--window-size=360,500',
      //'--window-position=000,000',
      '--start-maximized',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // solve error caused by same-origin policy
      // Evaluation failed: DOMException: Blocked a frame with origin
      // "https://www.deepbrid.com" from accessing a cross-origin frame
      // need for iframe solver
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',

      '--safebrowsing-disable-download-protection',
      //'--proxy-server=socks5://127.0.0.1:9050'
      ...proxy ? [`--proxy-server=${proxy.host}:${proxy.port}`] : []
      //`--proxy-server=${proxy0.ip}:${proxy0.port}`
      //`--proxy-server=${proxy0.url}`
    ]
  })
}

/** @param {Browser} browser */
const getFirstPage = async (browser) => {
  const pages = await browser.pages()
  const [page] = pages
  return page
}

/** @param {Browser} browser */
const getNewPage = (browser) => {
  return browser.newPage()
}

/** @param {Page} page */
const gotToCroxyProxy = async (page) => {
  await page.goto('https://www.croxyproxy.com')
  await page.content()

  await page.type('#url', 'https://www.deepbrid.com/service')

  // Click Download Button
  await page.waitForSelector('button[id="requestSubmit"]');
  await page.click('button[id="requestSubmit"]')
  // After click
  await page.waitForNavigation()
}

/** @param {Page} page */
const goToDeepbrid = async (page) => {
  await page.goto('https://www.deepbrid.com/service')
  await page.content()
}

const START_SITE_MAP = {
  CroxyProxy: gotToCroxyProxy,
  Deepbrid: goToDeepbrid
}

const A_HREF_ATTRIBUTE_MAP = {
  CroxyProxy: '__cporiginalvalueofhref',
  Deepbrid: 'href'
}

/**
 * @param {Page} page
 * @param {string} START
 * @param {string} LINK
 */
const getDownloadLink = async (page, START, LINK) => {
  console.log('LINK: ', LINK)
  // try {
  // Go to Start (First) Page
  const goToStart = START_SITE_MAP[START]
  await goToStart(page)

  // Enter value in the input
  await page.waitForSelector('#link')
  await page.type('#link', LINK)

  // Wait disclaimer
  await page.waitForSelector('div[role="dialog"]')

  // Click Download Button
  await page.waitForSelector('button[name="sendLink"]')
  await page.click('button[name="sendLink"]')
  // After click
  // await page.waitForNavigation()


  // Get next page for download https://www.deepbrid.com/dl?f=
  await page.waitForSelector('a[class="flex items-center mr-3"]')
  const attr = A_HREF_ATTRIBUTE_MAP[START]
  const aHref = await page.evaluate((attr) => document.querySelector('.mr-3')[attr], attr)
  console.log('HREF: ', aHref)

  return aHref
  // } catch (e) {
  //   console.error('ERROR', e)
  // nProxy++
  // await browser.close()
  // await start()
  // }
}

/** @param {Proxy} proxy */
const firstPartDownload = async (proxy) => {
  browser = await launchBrowser(proxy)

  let firstPage = await getFirstPage(browser)

  // Enable proxy
  // await useProxy(firstPage, proxyUrl)
  let aHref
  try {
    // Get first link from Deepbrid
    aHref = await getDownloadLink(firstPage, START, LINK[0])
  } catch (e) {
    console.error('ERROR', e)
    nProxy++
    if (nProxy === TOTAL_PROXIES) {
      nProxy = 0
    }
    await browser.close()
    await a()
    return
  }
  await browser.close()

  return aHref
}

/** @param {Proxy} proxy */
const firstAxiosDownload = async (proxy) => {
  try {
    // Get first link from Deepbrid
    const aHref = await DeepbridApi.getDLWithProxy(proxy, LINK[0])
    return aHref
  } catch (e) {
    // console.error('ERROR', e)
    nProxy++
    nProxy === TOTAL_PROXIES && (nProxy = 0)
    await a()
  }
}

const a = async () => {
  const proxy = proxies[nProxy]
  // console.log('PROXY', nProxy, proxy)
  console.log(`PROXY #${nProxy} ${JSON.stringify(proxy)}`)
  // const proxyUrl = `http://${proxy.host}:${proxy.port}`

  // const aHref = await firstPartDownload(proxy)
  // OR
  const aHref = await firstAxiosDownload(proxy)

  if (!browser) {
    browser = await launchBrowser(null)
  }

  // const secondPage = await getFirstPage(browser)
  const secondPage = await browser.newPage()

  // Go to first Download page of Deepbrid
  await secondPage.goto(aHref)
  await secondPage.content()

  // Wait disclaimer
  await secondPage.waitForSelector('div[role="dialog"]')

  try {
    // Solve
    await solve(secondPage)
  } catch (e) {
    // console.error('SOLVE ERROR', e.message)
  }

  try {
    // Click Download Button
    await secondPage.waitForSelector('button[name="download"]')
    await secondPage.click('button[name="download"]')

    // After click
    await secondPage.waitForNavigation()

    // Wait disclaimer
    await secondPage.waitForSelector('div[role="dialog"]')

    await secondPage.waitForSelector('button[class="button button--lg w-32 mr-2 mb-2 items-center flex justify-center bg-theme-9 text-white"]')
    await secondPage.click('button[class="button button--lg w-32 mr-2 mb-2 items-center flex justify-center bg-theme-9 text-white"]')

    // await secondPage.close()
  } catch (e) {
    // console.error('AFTER SOLVE ERROR')
  }
  await fileUtils.waitUntilDownloadFile('C:/Users/Computer/Downloads', '.crdownload')

  // setTimeout(async () => { await browser.close() }, 15000)

  LINK.shift()	// remove first

  if (LINK.length > 0) {
    nProxy++
    nProxy === TOTAL_PROXIES && (nProxy = 0)
    console.log('Call with LINK', LINK[0])

    await a()
  } else {
    console.log('END LINK')
    // await browser.close()
  }
}

const start = async () => {
  proxies = await ProxiesApi.FreeProxyListNetApi.getProxies()
  // proxies = await ProxiesApi.FreeProxyListComApi.getProxies()
  // proxies = await ProxiesApi.FreeProxyWorldApi.getProxies()
  // proxies = await ProxiesApi.ProxyScraperApi.getProxies()
  // proxies = configProxies.FreeProxyListNet
  TOTAL_PROXIES = proxies.length
  console.log(`Total proxies: ${TOTAL_PROXIES}`)
  // const { proxy1Arr } = require('../config/proxies')
  // proxies = proxy1Arr

  const b = async () => {
    const newPage = await getNewPage(browser)
    await getDownloadLink(newPage, START, LINK[1])
  }

  // Open New Browser
  // browser = await launchBrowser(null)

  console.log('Call with LINK', LINK[0])

  await a()
}

start()