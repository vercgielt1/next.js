const http = require('http')
const { parse } = require('url')
const next = require('next')

async function main() {
  const dev = global.isNextDev || false
  process.env.NODE_ENV = dev ? 'development' : 'production'

  const port = parseInt(process.env.PORT, 10) || 3000

  const app = next({ dev, port })
  const handle = app.getRequestHandler()

  await app.prepare()

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      if (pathname.startsWith('/render')) {
        await app.render(req, res, pathname, query)
      } else {
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  server.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(
      `> started server on url: http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    )
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
