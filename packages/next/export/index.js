import { cpus } from 'os'
import { fork } from 'child_process'
import { recursiveCopy } from '../lib/recursive-copy'
import mkdirpModule from 'mkdirp'
import { resolve, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'
import loadConfig, {
  isTargetLikeServerless
} from 'next-server/dist/server/config'
import {
  PHASE_EXPORT,
  SERVER_DIRECTORY,
  PAGES_MANIFEST,
  CONFIG_FILE,
  BUILD_ID_FILE,
  CLIENT_PUBLIC_FILES_PATH,
  CLIENT_STATIC_FILES_PATH
} from 'next-server/constants'
import { promisify } from 'util'
import { recursiveDelete } from '../lib/recursive-delete'
import { API_ROUTE } from '../lib/constants'
import { formatAmpMessages } from '../build/output/index'
import createSpinner from '../build/spinner'

const mkdirp = promisify(mkdirpModule)

const createProgress = (total, label = 'Exporting') => {
  let curProgress = 0
  let progressSpinner = createSpinner(`${label} (${curProgress}/${total})`, {
    spinner: {
      frames: [
        '[    ]',
        '[=   ]',
        '[==  ]',
        '[=== ]',
        '[ ===]',
        '[  ==]',
        '[   =]',
        '[    ]',
        '[   =]',
        '[  ==]',
        '[ ===]',
        '[====]',
        '[=== ]',
        '[==  ]',
        '[=   ]'
      ],
      interval: 80
    }
  })

  return () => {
    curProgress++

    const newText = `${label} (${curProgress}/${total})`
    if (progressSpinner) {
      progressSpinner.text = newText
    } else {
      console.log(newText)
    }

    if (curProgress === total && progressSpinner) {
      progressSpinner.stop()
      console.log(newText)
    }
  }
}

export default async function (dir, options, configuration) {
  function log (message) {
    if (options.silent || options.buildExport) return
    console.log(message)
  }

  dir = resolve(dir)
  const nextConfig = configuration || loadConfig(PHASE_EXPORT, dir)
  const concurrency = options.concurrency || 10
  const threads = options.threads || Math.max(cpus().length - 1, 1)
  const distDir = join(dir, nextConfig.distDir)
  const subFolders = nextConfig.exportTrailingSlash

  if (!options.buildExport && nextConfig.target !== 'server') {
    throw new Error(
      'Cannot export when target is not server. https://err.sh/zeit/next.js/next-export-serverless'
    )
  }

  log(`> using build directory: ${distDir}`)

  if (!existsSync(distDir)) {
    throw new Error(
      `Build directory ${distDir} does not exist. Make sure you run "next build" before running "next start" or "next export".`
    )
  }

  const buildId = readFileSync(join(distDir, BUILD_ID_FILE), 'utf8')
  const pagesManifest =
    !options.pages && require(join(distDir, SERVER_DIRECTORY, PAGES_MANIFEST))

  const pages = options.pages || Object.keys(pagesManifest)
  const defaultPathMap = {}

  for (const page of pages) {
    // _document and _app are not real pages
    // _error is exported as 404.html later on
    // API Routes are Node.js functions
    if (
      page === '/_document' ||
      page === '/_app' ||
      page === '/_error' ||
      page.match(API_ROUTE)
    ) {
      continue
    }

    defaultPathMap[page] = { page }
  }

  // Initialize the output directory
  const outDir = options.outdir
  await recursiveDelete(join(outDir))
  await mkdirp(join(outDir, '_next', buildId))

  // Copy static directory
  if (existsSync(join(dir, 'static'))) {
    log('  copying "static" directory')
    await recursiveCopy(join(dir, 'static'), join(outDir, 'static'))
  }

  // Copy .next/static directory
  if (existsSync(join(distDir, CLIENT_STATIC_FILES_PATH))) {
    log('  copying "static build" directory')
    await recursiveCopy(
      join(distDir, CLIENT_STATIC_FILES_PATH),
      join(outDir, '_next', CLIENT_STATIC_FILES_PATH)
    )
  }

  // Get the exportPathMap from the config file
  if (typeof nextConfig.exportPathMap !== 'function') {
    console.log(
      `> No "exportPathMap" found in "${CONFIG_FILE}". Generating map from "./pages"`
    )
    nextConfig.exportPathMap = async defaultMap => {
      return defaultMap
    }
  }

  // Start the rendering process
  const renderOpts = {
    dir,
    buildId,
    nextExport: true,
    assetPrefix: nextConfig.assetPrefix.replace(/\/$/, ''),
    distDir,
    dev: false,
    staticMarkup: false,
    hotReloader: null,
    canonicalBase: (nextConfig.amp && nextConfig.amp.canonicalBase) || '',
    isModern: nextConfig.experimental.modern
  }

  const { serverRuntimeConfig, publicRuntimeConfig } = nextConfig

  if (Object.keys(publicRuntimeConfig).length > 0) {
    renderOpts.runtimeConfig = publicRuntimeConfig
  }

  // We need this for server rendering the Link component.
  global.__NEXT_DATA__ = {
    nextExport: true
  }

  log(
    `  launching ${threads} threads with concurrency of ${concurrency} per thread`
  )
  const exportPathMap = await nextConfig.exportPathMap(defaultPathMap, {
    dev: false,
    dir,
    outDir,
    distDir,
    buildId
  })
  exportPathMap['/404.html'] = exportPathMap['/404.html'] || { page: '/_error' }
  const exportPaths = Object.keys(exportPathMap)
  const filteredPaths = exportPaths.filter(
    // Remove API routes
    route => !exportPathMap[route].page.match(API_ROUTE)
  )
  const hasApiRoutes = exportPaths.length !== filteredPaths.length

  // Warn if the user defines a path for an API page
  if (hasApiRoutes) {
    log(
      chalk.yellow(
        '  API pages are not supported by next export. https://err.sh/zeit/next.js/api-routes-static-export'
      )
    )
  }

  const progress =
    !options.silent &&
    createProgress(filteredPaths.length, options.buildExport && 'Prerendering')

  const chunks = filteredPaths.reduce((result, route, i) => {
    const worker = i % threads
    if (!result[worker]) {
      result[worker] = { paths: [], pathMap: {} }
    }
    result[worker].pathMap[route] = exportPathMap[route]
    result[worker].paths.push(route)

    if (options.sprPages && options.sprPages.has(route)) {
      result[worker].pathMap[route].sprPage = true
    }
    return result
  }, [])

  const ampValidations = {}
  let hadValidationError = false

  const publicDir = join(dir, CLIENT_PUBLIC_FILES_PATH)
  // Copy public directory
  if (
    nextConfig.experimental &&
    nextConfig.experimental.publicDirectory &&
    existsSync(publicDir)
  ) {
    log('  copying "public" directory')
    await recursiveCopy(publicDir, outDir, {
      filter (path) {
        // Exclude paths used by pages
        return !exportPathMap[path]
      }
    })
  }
  const workers = new Set()

  await Promise.all(
    chunks.map(
      chunk =>
        new Promise((resolve, reject) => {
          const worker = fork(require.resolve('./worker'), [], {
            env: process.env
          })
          workers.add(worker)
          worker.send({
            distDir,
            buildId,
            exportPaths: chunk.paths,
            exportPathMap: chunk.pathMap,
            outDir,
            renderOpts,
            serverRuntimeConfig,
            concurrency,
            subFolders,
            serverless: isTargetLikeServerless(nextConfig.target)
          })
          worker.on('message', ({ type, payload }) => {
            if (type === 'progress' && progress) {
              progress()
            } else if (type === 'error') {
              reject(payload)
            } else if (type === 'done') {
              resolve()
            } else if (type === 'amp-validation') {
              ampValidations[payload.page] = payload.result
              hadValidationError =
                hadValidationError || payload.result.errors.length
            }
          })
        })
    )
  )

  workers.forEach(worker => worker.kill())

  if (Object.keys(ampValidations).length) {
    console.log(formatAmpMessages(ampValidations))
  }
  if (hadValidationError) {
    throw new Error(
      `AMP Validation caused the export to fail. https://err.sh/zeit/next.js/amp-export-validation`
    )
  }

  // Add an empty line to the console for the better readability.
  log('')
}
