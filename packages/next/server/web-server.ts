import type { WebNextRequest, WebNextResponse } from './base-http/web'
import type { RenderOpts } from './render'
import type RenderResult from './render-result'
import type { NextParsedUrlQuery, NextUrlWithParsedQuery } from './request-meta'
import type { Params } from '../shared/lib/router/utils/route-matcher'
import type { PayloadOptions } from './send-payload'
import type { LoadComponentsReturnType } from './load-components'
import type { Options } from './base-server'

import BaseServer from './base-server'
import { byteLength } from './api-utils/web'
import { generateETag } from './lib/etag'
import { addRequestMeta } from './request-meta'

interface WebServerOptions extends Options {
  webServerConfig: {
    page: string
    loadComponent: (
      pathname: string
    ) => Promise<LoadComponentsReturnType | null>
    extendRenderOpts: Partial<BaseServer['renderOpts']> &
      Pick<BaseServer['renderOpts'], 'buildId'>
    pagesRenderToHTML?: typeof import('./render').renderToHTML
    appRenderToHTML?: typeof import('./app-render').renderToHTMLOrFlight
  }
}

export default class NextWebServer extends BaseServer<WebServerOptions> {
  private pagesRenderToHTML?: typeof import('./render').renderToHTML
  private appRenderToHTML?: typeof import('./app-render').renderToHTMLOrFlight

  constructor(options: WebServerOptions) {
    super(options)

    this.pagesRenderToHTML = options.webServerConfig.pagesRenderToHTML
    this.appRenderToHTML = options.webServerConfig.appRenderToHTML

    // Extend `renderOpts`.
    Object.assign(this.renderOpts, options.webServerConfig.extendRenderOpts)
  }

  protected generateRewrites() {
    // @TODO: assuming minimal mode right now
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  }
  protected handleCompression() {
    // For the web server layer, compression is automatically handled by the
    // upstream proxy (edge runtime or node server) and we can simply skip here.
  }
  protected getRoutesManifest() {
    return {
      headers: [],
      rewrites: {
        fallback: [],
        afterFiles: [],
        beforeFiles: [],
      },
      redirects: [],
    }
  }
  protected getPagePath() {
    // @TODO
    return ''
  }
  protected getPublicDir() {
    // Public files are not handled by the web server.
    return ''
  }
  protected getBuildId() {
    return this.serverOptions.webServerConfig.extendRenderOpts.buildId
  }
  protected loadEnvConfig() {
    // The web server does not need to load the env config. This is done by the
    // runtime already.
  }
  protected getHasStaticDir() {
    return false
  }
  protected generateImageRoutes() {
    return []
  }
  protected generateStaticRoutes() {
    return []
  }
  protected generateFsStaticRoutes() {
    return []
  }
  protected generatePublicRoutes() {
    return []
  }
  protected generateCatchAllMiddlewareRoute() {
    return []
  }
  protected getFontManifest() {
    return undefined
  }
  protected getPagesManifest() {
    return {
      [this.serverOptions.webServerConfig.page]: '',
    }
  }
  protected getAppPathsManifest() {
    return {
      [this.serverOptions.webServerConfig.page]: '',
    }
  }
  protected getFilesystemPaths() {
    return new Set<string>()
  }
  protected attachRequestMeta(
    req: WebNextRequest,
    parsedUrl: NextUrlWithParsedQuery
  ) {
    addRequestMeta(req, '__NEXT_INIT_QUERY', { ...parsedUrl.query })
  }
  protected getPrerenderManifest() {
    return {
      version: 3 as const,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: {
        previewModeId: '',
        previewModeSigningKey: '',
        previewModeEncryptionKey: '',
      },
    }
  }
  protected getServerComponentManifest() {
    return this.serverOptions.webServerConfig.extendRenderOpts
      .serverComponentManifest
  }
  protected async renderHTML(
    req: WebNextRequest,
    _res: WebNextResponse,
    pathname: string,
    query: NextParsedUrlQuery,
    renderOpts: RenderOpts
  ): Promise<RenderResult | null> {
    const curRenderToHTML = this.pagesRenderToHTML || this.appRenderToHTML
    if (curRenderToHTML) {
      return curRenderToHTML(
        {
          url: req.url,
          cookies: req.cookies,
          headers: req.headers,
        } as any,
        {} as any,
        pathname,
        query,
        {
          ...renderOpts,
          disableOptimizedLoading: true,
          runtime: 'experimental-edge',
        },
        !!this.pagesRenderToHTML
      )
    } else {
      throw new Error(`Invariant: curRenderToHTML is missing`)
    }
  }
  protected async sendRenderResult(
    _req: WebNextRequest,
    res: WebNextResponse,
    options: {
      result: RenderResult
      type: 'html' | 'json'
      generateEtags: boolean
      poweredByHeader: boolean
      options?: PayloadOptions | undefined
    }
  ): Promise<void> {
    res.setHeader('X-Edge-Runtime', '1')

    // Add necessary headers.
    // @TODO: Share the isomorphic logic with server/send-payload.ts.
    if (options.poweredByHeader && options.type === 'html') {
      res.setHeader('X-Powered-By', 'Next.js')
    }
    if (!res.getHeader('Content-Type')) {
      res.setHeader(
        'Content-Type',
        options.type === 'json'
          ? 'application/json'
          : 'text/html; charset=utf-8'
      )
    }

    if (options.result.isDynamic()) {
      const writer = res.transformStream.writable.getWriter()
      options.result.pipe({
        write: (chunk: Uint8Array) => writer.write(chunk),
        end: () => writer.close(),
        destroy: (err: Error) => writer.abort(err),
        cork: () => {},
        uncork: () => {},
        // Not implemented: on/removeListener
      } as any)
    } else {
      const payload = await options.result.toUnchunkedString()
      res.setHeader('Content-Length', String(byteLength(payload)))
      if (options.generateEtags) {
        res.setHeader('ETag', generateETag(payload))
      }
      res.body(payload)
    }

    res.send()
  }
  protected async runApi() {
    // @TODO
    return true
  }
  protected async findPageComponents(
    pathname: string,
    query?: NextParsedUrlQuery,
    params?: Params | null
  ) {
    const result = await this.serverOptions.webServerConfig.loadComponent(
      pathname
    )
    if (!result) return null

    return {
      query: {
        ...(query || {}),
        ...(params || {}),
      },
      components: result,
    }
  }
}
