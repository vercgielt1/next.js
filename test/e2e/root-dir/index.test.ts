import { createNext, FileRef } from 'e2e-utils'
import { NextInstance } from 'test/lib/next-modes/base'
import { fetchViaHTTP, renderViaHTTP } from 'next-test-utils'
import path from 'path'
import cheerio from 'cheerio'

describe('root dir', () => {
  let next: NextInstance

  beforeAll(async () => {
    next = await createNext({
      files: {
        public: new FileRef(path.join(__dirname, 'app/public')),
        pages: new FileRef(path.join(__dirname, 'app/pages')),
        root: new FileRef(path.join(__dirname, 'app/root')),
        'root.server.js': new FileRef(
          path.join(__dirname, 'app/root.server.js')
        ),
        'next.config.js': new FileRef(
          path.join(__dirname, 'app/next.config.js')
        ),
      },
      dependencies: {
        react: '18.0.0-rc.2',
        'react-dom': '18.0.0-rc.2',
      },
    })
  })
  afterAll(() => next.destroy())

  it('should serve from pages', async () => {
    const html = await renderViaHTTP(next.url, '/')
    expect(html).toContain('hello from pages/index')
  })

  it('should serve dynamic route from pages', async () => {
    const html = await renderViaHTTP(next.url, '/blog/first')
    expect(html).toContain('hello from pages/blog/[slug]')
  })

  it('should serve from public', async () => {
    const html = await renderViaHTTP(next.url, '/hello.txt')
    expect(html).toContain('hello world')
  })

  it('should serve from root', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard')
    expect(html).toContain('hello from root/dashboard')
  })

  it('should not include parent when new root', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/integrations')
    const $ = cheerio.load(html)
    // Should not be nested in dashboard
    expect($('h1').text()).toBeFalsy()
    // Should include the page text
    expect($('p').text()).toBe('hello from root/dashboard/integrations')
  })

  it('should not include parent when not in parent directory with route in directory', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/rootonly/hello')
    const $ = cheerio.load(html)

    // Should be nested in /root.js
    expect($('html').hasClass('this-is-the-document-html')).toBeTruthy()
    expect($('body').hasClass('this-is-the-document-body')).toBeTruthy()

    // Should not be nested in dashboard
    expect($('h1').text()).toBeFalsy()

    // Should render the page text
    expect($('p').text()).toBe('hello from root/dashboard/rootonly/hello')
  })

  it('should not include parent document when new root', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/integrations')
    const $ = cheerio.load(html)

    // Root has to provide it's own document
    expect($('html').hasClass('this-is-the-document-html')).toBeFalsy()
    expect($('body').hasClass('this-is-the-document-body')).toBeFalsy()
  })

  it('should not include parent when not in parent directory', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/changelog')
    const $ = cheerio.load(html)
    // Should not be nested in dashboard
    expect($('h1').text()).toBeFalsy()
    // Should include the page text
    expect($('p').text()).toBe('hello from root/dashboard/changelog')
  })

  it('should serve nested parent', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/deployments/123')
    const $ = cheerio.load(html)
    // Should be nested in dashboard
    expect($('h1').text()).toBe('Dashboard')
    // Should be nested in deployments
    expect($('h2').text()).toBe('Deployments (hello)')
  })

  it('should serve dynamic parameter', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard/deployments/123')
    const $ = cheerio.load(html)
    // Should include the page text with the parameter
    expect($('p').text()).toBe(
      'hello from root/dashboard/deployments/[id]. ID is: 123'
    )
  })

  it('should include document html and body', async () => {
    const html = await renderViaHTTP(next.url, '/dashboard')
    const $ = cheerio.load(html)

    expect($('html').hasClass('this-is-the-document-html')).toBeTruthy()
    expect($('body').hasClass('this-is-the-document-body')).toBeTruthy()
  })

  it('should not serve when layout is provided but no folder index', async () => {
    const res = await fetchViaHTTP(next.url, '/dashboard/deployments')
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('This page could not be found')
  })

  it('should match partial parameters', async () => {
    const html = await renderViaHTTP(next.url, '/partial-match-123')
    expect(html).toContain('hello from root/partial-match-[id]. ID is: 123')
  })

  describe('parallel routes', () => {
    describe('conditional routes', () => {
      it('should serve user page', async () => {
        const html = await renderViaHTTP(next.url, '/conditional/tim')
        expect(html).toContain('hello from user homepage')
      })

      it('should serve user teams page', async () => {
        const html = await renderViaHTTP(next.url, '/conditional/tim/teams')
        expect(html).toContain('hello from user/teams')
      })

      it('should not serve teams page to user', async () => {
        const html = await renderViaHTTP(next.url, '/conditional/tim/members')
        expect(html).not.toContain('hello from team/members')
      })

      it('should serve team page', async () => {
        const html = await renderViaHTTP(next.url, '/conditional/vercel')
        expect(html).toContain('hello from team homepage')
      })

      it('should serve team members page', async () => {
        const html = await renderViaHTTP(
          next.url,
          '/conditional/vercel/members'
        )
        expect(html).toContain('hello from team/members')
      })

      it('should provide both matches if both paths match', async () => {
        const html = await renderViaHTTP(next.url, '/conditional/both')
        expect(html).toContain('hello from team homepage')
        expect(html).toContain('hello from user homepage')
      })

      it('should 404 based on getServerSideProps', async () => {
        const res = await fetchViaHTTP(next.url, '/conditional/nonexistent')
        expect(res.status).toBe(404)
        expect(await res.text()).toContain('This page could not be found')
      })
    })
  })
})
