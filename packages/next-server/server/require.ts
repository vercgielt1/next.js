import fs from 'fs'
import {join} from 'path'
import {promisify} from 'util'
import {PAGES_MANIFEST, SERVER_DIRECTORY} from '../lib/constants'
import { normalizePagePath } from './normalize-page-path'

const readFile = promisify(fs.readFile)

export function pageNotFoundError(page: string): Error {
  const err: any = new Error(`Cannot find module for page: ${page}`)
  err.code = 'ENOENT'
  return err
}

export function getPagePath(page: string, distDir: string): string {
  const serverBuildPath = join(distDir, SERVER_DIRECTORY)
  const pagesManifest = require(join(serverBuildPath, PAGES_MANIFEST))

  try {
    page = normalizePagePath(page)
    page = page === '/' ? '/index' : page
  } catch (err) {
    // tslint:disable-next-line
    console.error(err)
    throw pageNotFoundError(page)
  }

  if (!pagesManifest[page]) {
    const cleanedPage = page.replace(/\/index$/, '') || '/'
    if (!pagesManifest[cleanedPage]) {
      throw pageNotFoundError(page)
    } else {
      page = cleanedPage
    }
  }
  return join(serverBuildPath, pagesManifest[page])
}

export function requirePage(page: string, distDir: string): any {
  const pagePath = getPagePath(page, distDir)
  if (pagePath.endsWith('.html')) {
    return readFile(pagePath, 'utf8')
  }
  return require(pagePath)
}
