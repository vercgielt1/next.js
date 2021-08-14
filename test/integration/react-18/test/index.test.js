/* eslint-env jest */

import { join } from 'path'
import fs from 'fs-extra'

import {
  File,
  findPort,
  killApp,
  launchApp,
  nextBuild,
  nextStart,
  renderViaHTTP,
} from 'next-test-utils'
import concurrent from './concurrent'

jest.setTimeout(1000 * 60 * 5)

// overrides react and react-dom to v18
const nodeArgs = ['-r', join(__dirname, 'require-hook.js')]
const appDir = join(__dirname, '../app')
const nextConfig = new File(join(appDir, 'next.config.js'))
const dynamicHello = new File(join(appDir, 'components/dynamic-hello.js'))

const SUSPENSE_ERROR_MESSAGE =
  'Disallowed suspense option usage with next/dynamic'
const UNSUPPORTED_PRERELEASE =
  "You are using an unsupported prerelease of 'react-dom'"
const USING_CREATE_ROOT = 'Using the createRoot API for React'

async function getBuildOutput(dir) {
  const { stdout, stderr } = await nextBuild(dir, [], {
    stdout: true,
    stderr: true,
    nodeArgs,
  })
  return stdout + stderr
}

async function getDevOutput(dir) {
  const port = await findPort()

  let stdout = ''
  let stderr = ''
  let instance = await launchApp(dir, port, {
    stdout: true,
    stderr: true,
    onStdout(msg) {
      stdout += msg
    },
    onStderr(msg) {
      stderr += msg
    },
    nodeArgs,
  })
  await killApp(instance)
  return stdout + stderr
}

describe('React 18 Support', () => {
  describe('no warns with stable supported version of react-dom', () => {
    beforeAll(async () => {
      await fs.remove(join(appDir, 'node_modules'))
      nextConfig.replace('reactRoot: true', '// reactRoot: true')
    })
    afterAll(() => {
      nextConfig.replace('// reactRoot: true', 'reactRoot: true')
    })

    test('supported version of react in dev', async () => {
      const output = await getDevOutput(appDir)
      expect(output).not.toMatch(USING_CREATE_ROOT)
      expect(output).not.toMatch(UNSUPPORTED_PRERELEASE)
    })

    test('supported version of react in build', async () => {
      const output = await getBuildOutput(appDir)
      expect(output).not.toMatch(USING_CREATE_ROOT)
      expect(output).not.toMatch(UNSUPPORTED_PRERELEASE)
    })
  })

  describe('warns with stable supported version of react-dom', () => {
    beforeAll(async () => {
      const reactDomPkgPath = join(
        appDir,
        'node_modules/react-dom/package.json'
      )
      await fs.outputJson(reactDomPkgPath, {
        name: 'react-dom',
        version: '18.0.0-alpha-c76e4dbbc-20210722',
      })
    })
    afterAll(async () => await fs.remove(join(appDir, 'node_modules')))

    test('prerelease version of react in dev', async () => {
      const output = await getDevOutput(appDir)
      expect(output).toMatch(USING_CREATE_ROOT)
      expect(output).toMatch(UNSUPPORTED_PRERELEASE)
    })

    test('prerelease version of react in build', async () => {
      const output = await getBuildOutput(appDir)
      expect(output).toMatch(USING_CREATE_ROOT)
      expect(output).toMatch(UNSUPPORTED_PRERELEASE)
    })
  })
})

describe('Blocking mode', () => {
  beforeAll(() => {
    dynamicHello.replace('suspense = false', `suspense = true`)
  })
  afterAll(() => {
    dynamicHello.restore()
  })

  it('suspense is not allowed in blocking rendering mode (prod)', async () => {
    const output = await getBuildOutput(appDir)
    expect(output).toContain(SUSPENSE_ERROR_MESSAGE)
  })
})

describe('Concurrent mode', () => {
  beforeAll(async () => {
    nextConfig.replace(
      '// concurrentFeatures: true',
      'concurrentFeatures: true'
    )
    dynamicHello.replace('suspense = false', `suspense = true`)
    // `noSSR` mode will be ignored by suspense
    dynamicHello.replace('let ssr', `let ssr = false`)
  })
  afterAll(async () => {
    nextConfig.restore()
    dynamicHello.restore()
  })

  runTests('concurrentFeatures is enabled', 'dev', (context) =>
    concurrent(context, (p, q) => renderViaHTTP(context.appPort, p, q))
  )
  runTests('concurrentFeatures is enabled', 'prod', (context) =>
    concurrent(context, (p, q) => renderViaHTTP(context.appPort, p, q))
  )
})

function runTests(name, mode, fn) {
  const context = { appDir }
  describe(`${name} (${mode})`, () => {
    beforeAll(async () => {
      context.appPort = await findPort()
      if (mode === 'dev') {
        context.server = await launchApp(context.appDir, context.appPort, {
          nodeArgs,
        })
      } else {
        await nextBuild(context.appDir, [], { nodeArgs })
        context.server = await nextStart(context.appDir, context.appPort, {
          nodeArgs,
        })
      }
    })
    afterAll(async () => {
      await killApp(context.server)
    })
    fn(context)
  })
}
