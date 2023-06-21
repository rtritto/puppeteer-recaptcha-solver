// import path from 'node:path'
// import url from 'node:url'
// import { promisify } from 'node:util'
// import childProcess from 'node:child_process'
// const exec = promisify(childProcess.exec)
import puppeteer from 'puppeteer-extra'
// import { proxyRequest } from 'puppeteer-proxy'
// import useProxy from 'puppeteer-page-proxy'
// import getFreeProxies from 'get-free-https-proxy'
import ProxiesApi from 'free-proxy-generator'
// import P from 'free-http-proxy'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// import solve from '../index.mjs'  // reCAPTCHA and hCaptcha

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const pathToExtension = path.join(__dirname, '../extensions/uBlock-Origin-1.33.2')

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

async function createServerProxy() {

}
let LINK
async function launch() {
  puppeteer.use(StealthPlugin())

  // const n = 99
  // const proxy1 = (await getFreeProxies())[n]
  // console.log('proxy1', n, proxy1)
  LINK = 'http://www.easybytez.com/<ID>/<NAME>'

  const proxyList = await ProxiesApi.FreeProxyListComApi.getProxies()
  // const proxy0 = await proxyList.random()
  // const proxy0 = await proxyList.getByCountryCode('FR')
  const proxy0 = { url: 'https://45.13.80.144:8080' }

  // const t = new P()
  // const [proxy0] = await t.getProxys(1)

  console.log('PROXY', proxy0)

  const browser = await puppeteer.launch({
    headless: false,
    //defaultViewport: null,
    //ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      //'--window-size=360,500',
      //'--window-position=000,000',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      //'--proxy-server=socks5://127.0.0.1:9050'
      //`--proxy-server=${proxy1.host}:${proxy1.port}`
      //`--proxy-server=${proxy0.ip}:${proxy0.port}`
      `--proxy-server=${proxy0.url}`
    ]
  })

  return browser
}

async function newPage(browser) {
  const page = await browser.newPage()
  //await useProxy(page, 'http://127.0.0.1:8000')
  // await proxyRequest({
  //     page,
  //     proxyUrl: 'http://127.0.0.1:9050'
  //   })
  // await page.setViewport({
  //   width: 1920 + Math.floor(Math.random() * 100),
  //   height: 3000 + Math.floor(Math.random() * 100),
  //   deviceScaleFactor: 1,
  //   hasTouch: false,
  //   isLandscape: false,
  //   isMobile: false,
  // });

  //await page.setDefaultNavigationTimeout(0)

  try {
    //await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent')
    //'https://www.deepbrid.com/service'
    //'https://jsonip.com'
    //'https://www.google.com/recaptcha/api2/demo'

    await page.goto('https://www.deepbrid.com/service')
    await page.content()
    //await page.waitForTimeout(5000)

    //await delay(2000)
    //page.getElementsByName('h-captcha-response')

    //const el = await promisify(page.$eval('#link'))
    try {
      //page.solveRecaptchas(page)

      //Enter value in the input
      await page.type('#link', LINK)

      // Click Download Button
      await page.waitForSelector('button[name="sendLink"]');
      await page.click('button[name="sendLink"]')
      // After click
      await page.waitForNavigation()

      const a = page.querySelector('a[class="flex items-center mr-3')
      const aHref = a.getAttribute('href')
      // const aHref = await page.evaluate(
      //   () => Array.from(
      //     document.querySelectorAll('a[class="flex items-center mr-3'),
      //     a => a.getAttribute('href')
      //   )
      // )
      //const aHref = await page.waitForSelector('a[class="flex items-center mr-3"]');
      console.log('aHref', aHref)
      //await page.click('a[class="flex items-center mr-3"]')
      // await page.$('select[name="sendLink"]')
    } catch (e) {
      console.log('ERROR 1', e.message)
      page.solveRecaptchas(page)
      console.log('SOLVED 1')
      // await solve(
      //   page,
      //   'https://assets.hcaptcha.com/captcha/v1',
      //   'https://assets.hcaptcha.com/captcha/v1',
      //   1,
      //   '#checkbox',
      //   'https://imgs.hcaptcha.com'
      // )
    }
  } catch (e) {
    // console.log('ERROR 2', e.message)
    // console.log('> RESTART "docker restart torproxy" Incoming...')
    // //process.exit()
    // await exec('docker restart torproxy')
    // console.log('> RESTART OK!')
    // await newPage()
  }

  //solve(page, 'api2/anchor', 'api2/bframe', 0, '#recaptcha-anchor', 'api2/anchor')
}

console.log('`ctrl + c` to exit')
process.on('SIGINT', () => {
  console.log('bye!')
  process.exit()
})

// async function f() {
//   const { stdout } = await exec('docker logs torproxy')

//   const stdoutArr = JSON.stringify(stdout).split('\\n')
//   console.log(stdoutArr.length)
// }
// f()

async function run() {
  const browser = await launch()
  await newPage(browser)
}

run()