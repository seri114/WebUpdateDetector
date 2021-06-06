import * as puppeteer from 'puppeteer'
import AsyncRetry = require('async-retry')

export class FetchPage {
  browser!: puppeteer.Browser;
  // constructor () {}

  public close () {
    if (this.browser) {
      this.browser.close()
    }
  }

  public async fetch (url: string, selector: string | null = null): Promise<[string, Buffer]> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        // headless: false,
        args: ['--no-sandbox']
      })
    }

    const page = await this.browser.newPage()
    let body = ''
    let buf: any

    try {
      await AsyncRetry(
        async () => {
          await page.setViewport({
            width: 1200,
            height: 800
          })
          await page.goto(url)

          const a = await page.evaluate((selector) => {
            if (selector !== null) {
              const element = document.querySelector(selector)
              const { width, height, top: y, left: x } = element.getBoundingClientRect()
              return [element ? element.innerHTML : '', { width, height, x, y }]
            }
            const { width, height, top: y, left: x } = document.body.getBoundingClientRect()
            return [document.body.innerText, { width, height, x, y }]
          }, selector)
          body = a[0]
          const rect: any = a[1]
          rect.height = Math.min(rect.height, 5000)
          const options: puppeteer.BinaryScreenShotOptions = {
            encoding: 'binary',
            clip: rect
          }
          buf = await page.screenshot(options)
        },
        {
          onRetry: (err, attempt: number) => {
            console.log(`#${attempt} Retrying to fetch ${url} -- ${err.message}`)
          },
          retries: 3,
          minTimeout: 2000,
          maxTimeout: 10000
        }
      )
      console.log(`fetch ${url} complete`)
    } catch (e) {
      console.error(`failed to fetch ${url} -- ${e.message}`)
      throw e
    } finally {
      await page.close()
    }

    return [body, buf]
  }

  public async fetchTitle (url: string): Promise<string> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        // headless: false,
        args: ['--no-sandbox']
      })
    }

    const page = await this.browser.newPage()
    let title = ''

    try {
      await AsyncRetry(
        async () => {
          await page.setViewport({
            width: 1200,
            height: 800
          })
          await page.goto(url)
          title = await page.title()
        },
        {
          onRetry: (err, attempt: number) => {
            console.log(`#${attempt} Retrying to fetch ${url} -- ${err.message}`)
          },
          retries: 3,
          minTimeout: 2000,
          maxTimeout: 10000
        }
      )
      console.log(`fetch ${url} complete`)
    } catch (e) {
      console.error(`failed to fetch ${url} -- ${e.message}`)
      throw e
    } finally {
      await page.close()
    }

    return title
  }
}
