/* eslint-env jest */
import { join } from 'path'
import { execSync } from 'child_process'
import {
  findPort,
  killApp,
  launchApp,
  nextBuild,
  nextStart,
  renderViaHTTP,
} from 'next-test-utils'

let app
let appPort
const appDir = join(__dirname, '../')

const runTests = () => {
  it('should resolve index page correctly', async () => {
    const html = await renderViaHTTP(appPort, '/')
    expect(html).toContain('Hello, World!')
  })
}

const runRelayCompiler = () => {
  // Relay expects the current directory to contain a relay.json
  // This ensures the CWD is the one with relay.json since running
  // the relay-compiler through yarn would make the root of the repo the CWD.
  execSync('../../../node_modules/relay-compiler/cli.js relay.json', {
    cwd: './test/integration/relay-graphql-swc',
  })
}

describe('Error no pageProps', () => {
  describe('dev mode', () => {
    beforeAll(async () => {
      runRelayCompiler()
      appPort = await findPort()
      app = await launchApp(appDir, appPort)
    })
    afterAll(() => killApp(app))

    runTests()
  })

  describe('production mode', () => {
    beforeAll(async () => {
      runRelayCompiler()
      await nextBuild(appDir)
      appPort = await findPort()
      app = await nextStart(appDir, appPort)
    })

    afterAll(() => killApp(app))

    runTests()
  })
})
