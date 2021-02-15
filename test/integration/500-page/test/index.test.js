/* eslint-env jest */

import fs from 'fs-extra'
import { join } from 'path'
import {
  killApp,
  findPort,
  launchApp,
  nextStart,
  nextBuild,
  renderViaHTTP,
  fetchViaHTTP,
  waitFor,
  getPageFileFromPagesManifest,
} from 'next-test-utils'

jest.setTimeout(1000 * 60 * 2)

const appDir = join(__dirname, '../')
const pages500 = join(appDir, 'pages/500.js')
const pagesApp = join(appDir, 'pages/_app.js')
const nextConfig = join(appDir, 'next.config.js')
const gip500Err = /`pages\/500` can not have getInitialProps\/getServerSideProps/

let nextConfigContent
let appPort
let app

const runTests = (mode = 'server') => {
  it('should use pages/500', async () => {
    const html = await renderViaHTTP(appPort, '/500')
    expect(html).toContain('custom 500 page')
  })

  it('should set correct status code with pages/500', async () => {
    const res = await fetchViaHTTP(appPort, '/500')
    expect(res.status).toBe(500)
  })

  it('should not error when visited directly', async () => {
    const res = await fetchViaHTTP(appPort, '/500')
    expect(res.status).toBe(500)
    expect(await res.text()).toContain('custom 500 page')
  })

  if (mode !== 'dev') {
    it('should output 500.html during build', async () => {
      const page = getPageFileFromPagesManifest(appDir, '/500')
      expect(page.endsWith('.html')).toBe(true)
    })

    it('should add /500 to pages-manifest correctly', async () => {
      const manifest = await fs.readJSON(
        join(appDir, '.next', mode, 'pages-manifest.json')
      )
      expect('/500' in manifest).toBe(true)
    })
  }
}

describe('500 Page Support', () => {
  describe('dev mode', () => {
    beforeAll(async () => {
      appPort = await findPort()
      app = await launchApp(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests('dev')
  })

  describe('server mode', () => {
    beforeAll(async () => {
      await nextBuild(appDir)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests('server')
  })

  describe('serverless mode', () => {
    beforeAll(async () => {
      nextConfigContent = await fs.readFile(nextConfig, 'utf8')
      await fs.writeFile(
        nextConfig,
        `
        module.exports = {
          target: 'serverless'
        }
      `
      )
      await nextBuild(appDir)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })
    afterAll(async () => {
      await fs.writeFile(nextConfig, nextConfigContent)
      await killApp(app)
    })

    runTests('serverless')
  })

  it('still build statically with getInitialProps in _app', async () => {
    await fs.writeFile(
      pagesApp,
      `
      import App from 'next/app'

      const page = ({ Component, pageProps }) => <Component {...pageProps} />
      page.getInitialProps = (ctx) => App.getInitialProps(ctx)
      export default page
    `
    )
    const { stderr, code } = await nextBuild(appDir, [], { stderr: true })
    await fs.remove(pagesApp)

    expect(stderr).not.toMatch(gip500Err)
    expect(code).toBe(0)
    expect(
      await fs.pathExists(join(appDir, '.next/server/pages/500.html'))
    ).toBe(true)
  })

  it('shows error with getInitialProps in pages/500 build', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      page.getInitialProps = () => ({ a: 'b' })
      export default page
    `
    )
    const { stderr, code } = await nextBuild(appDir, [], { stderr: true })
    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).toMatch(gip500Err)
    expect(code).toBe(1)
  })

  it('shows error with getInitialProps in pages/500 dev', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      page.getInitialProps = () => ({ a: 'b' })
      export default page
    `
    )

    let stderr = ''
    appPort = await findPort()
    app = await launchApp(appDir, appPort, {
      onStderr(msg) {
        stderr += msg || ''
      },
    })
    await renderViaHTTP(appPort, '/500')
    await waitFor(1000)

    await killApp(app)

    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).toMatch(gip500Err)
  })

  it('does not show error with getStaticProps in pages/500 build', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      export const getStaticProps = () => ({ props: { a: 'b' } })
      export default page
    `
    )
    const { stderr, code } = await nextBuild(appDir, [], { stderr: true })
    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).not.toMatch(gip500Err)
    expect(code).toBe(0)
  })

  it('does not show error with getStaticProps in pages/500 dev', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      export const getStaticProps = () => ({ props: { a: 'b' } })
      export default page
    `
    )

    let stderr = ''
    appPort = await findPort()
    app = await launchApp(appDir, appPort, {
      onStderr(msg) {
        stderr += msg || ''
      },
    })
    await renderViaHTTP(appPort, '/abc')
    await waitFor(1000)

    await killApp(app)

    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).not.toMatch(gip500Err)
  })

  it('shows error with getServerSideProps in pages/500 build', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      export const getServerSideProps = () => ({ props: { a: 'b' } })
      export default page
    `
    )
    const { stderr, code } = await nextBuild(appDir, [], { stderr: true })
    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).toMatch(gip500Err)
    expect(code).toBe(1)
  })

  it('shows error with getServerSideProps in pages/500 dev', async () => {
    await fs.move(pages500, `${pages500}.bak`)
    await fs.writeFile(
      pages500,
      `
      const page = () => 'custom 500 page'
      export const getServerSideProps = () => ({ props: { a: 'b' } })
      export default page
    `
    )

    let stderr = ''
    appPort = await findPort()
    app = await launchApp(appDir, appPort, {
      onStderr(msg) {
        stderr += msg || ''
      },
    })
    await renderViaHTTP(appPort, '/500')
    await waitFor(1000)

    await killApp(app)

    await fs.remove(pages500)
    await fs.move(`${pages500}.bak`, pages500)

    expect(stderr).toMatch(gip500Err)
  })
})
