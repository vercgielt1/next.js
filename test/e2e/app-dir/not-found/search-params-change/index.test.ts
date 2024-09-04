import { nextTestSetup } from 'e2e-utils'

describe('app dir - not-found - search-params-change', () => {
  const { next, skipped } = nextTestSetup({
    files: __dirname,
    skipDeployment: true,
  })

  if (skipped) {
    return
  }

  it('should reset not found error boundary when query params change', async () => {
    let browser = await next.browser('/')

    type BtnIds = 'home' | 'sp-no-query' | 'sp-q-200' | 'sp-q-404'

    const btnClickByIds: BtnIds[] = [
      'home',
      'sp-no-query',
      'sp-q-200',
      'sp-q-404',
      'sp-q-200',
      'sp-q-404',
      'home',
      'sp-q-404',
    ]

    for (const btnId of btnClickByIds) {
      switch (btnId) {
        case 'home':
          await browser.elementById(btnId).click()
          await browser.waitForElementByCss('h1#home')
          expect(await browser.elementByCss('h1').text()).toBe('My page')
          break
        case 'sp-no-query':
          await browser.elementById(btnId).click()
          await browser.waitForElementByCss('p#no-query')
          expect(await browser.elementByCss('p').text()).toBe(
            'search param page'
          )
          break
        case 'sp-q-200':
          await browser.elementById(btnId).click()
          await browser.waitForElementByCss('p#sp-200')
          expect(await browser.elementByCss('p').text()).toBe(
            'search param page'
          )
          break
        case 'sp-q-404':
          await browser.elementById(btnId).click()
          await browser.waitForElementByCss('h1#not-found')
          expect(await browser.elementByCss('h1').text()).toBe('Not Found')
          break
        default:
          break
      }
    }
  })

  it('should return 404 status code for custom not-found page', async () => {
    const res = await next.fetch('/_not-found')
    expect(res.status).toBe(404)
  })
})
