import { promises } from 'node:fs'
import path from 'node:path'
import { get as httpsGet } from 'node:https'
import { get as httpGet } from 'node:http'
import { fullLists, PuppeteerBlocker } from '@cliqz/adblocker-puppeteer'

export const hookBlocker = (page) => {
  const fetch = (url) => {
    const handler = url.startsWith('https://')
      ? httpsGet
      : httpGet

    return new Promise((resolve, reject) => {
      return handler(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(`Unexpected status code: ${response.statusCode}.`)
        }

        let result = ''

        response.on('data', (chunk) => {
          result += chunk
        })

        response.on('end', () => {
          return resolve({ text: () => result })
        })
      })
    })
  }

  return PuppeteerBlocker.fromLists(fetch,
    fullLists,
    { enableCompression: false },
    {
      path: path.join(
        __dirname,
        '../extensions/puppeteer-extra-plugin-adblocker-2.13.0-engine.bin'
      ),
      read: promises.readFile,
      write: promises.writeFile,
    }
  ).then((blocker) => blocker.enableBlockingInPage(page))
}