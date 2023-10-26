import { createNextDescribe } from 'e2e-utils'
import { getRedboxSource, hasRedbox } from 'next-test-utils'

createNextDescribe(
  'module layer',
  {
    files: __dirname,
  },
  ({ next, isNextStart, isNextDev }) => {
    function runTests() {
      it('should render routes marked with restriction marks without errors', async () => {
        const routes = [
          // app client components pages
          '/app/client',
          '/app/client-edge',
          // app sever components pages
          '/app/server',
          '/app/server-edge',
          // app routes
          '/app/route',
          '/app/route-edge',
          // pages/api
          '/api/hello',
          '/api/hello-edge',
          '/api/mixed',
        ]

        for (const route of routes) {
          const { status } = await next.fetch(route)
          expect([route, status]).toEqual([route, 200])
        }
      })

      if (isNextStart) {
        it('should log the build info properly', async () => {
          const cliOutput = next.cliOutput
          expect(cliOutput).toContain('Middleware')

          const functionsManifest = JSON.parse(
            await next.readFile('.next/server/functions-config-manifest.json')
          )
          expect(functionsManifest.functions).toContainKeys([
            '/app/route-edge',
            '/api/hello-edge',
            '/app/client-edge',
            '/app/server-edge',
          ])
          const pagesManifest = JSON.parse(
            await next.readFile('.next/server/pages-manifest.json')
          )
          const middlewareManifest = JSON.parse(
            await next.readFile('.next/server/middleware-manifest.json')
          )
          expect(middlewareManifest.middleware).toBeTruthy()
          expect(pagesManifest).toContainKeys([
            '/api/hello-edge',
            '/pages-ssr',
            '/api/hello',
          ])
        })
      }
    }

    describe('with server-only in server targets', () => {
      runTests()
    })

    // Should error for using mixed (with client-only) in server targets
    if (isNextDev) {
      describe('no server-only in server targets', () => {
        const middlewareFile = 'middleware.js'
        // const pagesApiFile = 'pages/api/hello.js'
        let middlewareContent = ''
        // let pagesApiContent = ''

        beforeAll(async () => {
          await next.stop()

          middlewareContent = await next.readFile(middlewareFile)
          // pagesApiContent = await next.readFile(pagesApiFile)

          await next.patchFile(
            middlewareFile,
            middlewareContent
              // .replace("import 'server-only'", "// import 'server-only'")
              .replace(
                "// import './lib/mixed-lib'",
                "import './lib/mixed-lib'"
              )
          )

          // await next.patchFile(
          //   pagesApiFile,
          //   pagesApiContent
          //     .replace("import 'server-only'", "// import 'server-only'")
          //     .replace(
          //       "// import '../../lib/mixed-lib'",
          //       "import '../../lib/mixed-lib'"
          //     )
          // )

          await next.start()
        })
        afterAll(async () => {
          await next.patchFile(middlewareFile, middlewareContent)
          // await next.patchFile(pagesApiFile, pagesApiContent)
        })

        it('should error when import client-only in middleware', async () => {
          const browser = await next.browser('/')

          expect(await hasRedbox(browser, true)).toBe(true)
          expect(await getRedboxSource(browser)).toContain(
            `You're importing a component that imports client-only. It only works in a Client Component but none of its parents are marked with "use client", so they're Server Components by default.`
          )
        })
      })
    }
  }
)
