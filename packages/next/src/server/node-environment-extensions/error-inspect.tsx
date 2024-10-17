import * as fs from 'fs'
import * as path from 'path'
import url from 'url'
import * as util from 'util'
import {
  SourceMapConsumer as SyncSourceMapConsumer,
  type RawSourceMap,
} from 'next/dist/compiled/source-map'
import dataUriToBuffer from 'next/dist/compiled/data-uri-to-buffer'
import { type StackFrame } from 'next/dist/compiled/stacktrace-parser'
import { parseStack } from '../../client/components/react-dev-overlay/server/middleware'
import { getSourceMapUrl } from '../../client/components/react-dev-overlay/internal/helpers/get-source-map-url'

// TODO: Implement for Edge runtime
const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')

// This matches either of these V8 formats.
//     at name (filename:0:0)
//     at filename:0:0
//     at async filename:0:0
const frameRegExp =
  /^ {3} at (?:(.+) \((.+):(\d+):(\d+)\)|(?:async )?(.+):(\d+):(\d+))$/

function getSourceMapFromFile(filename: string): RawSourceMap | null {
  filename = filename.startsWith('file://')
    ? url.fileURLToPath(filename)
    : filename

  let fileContents: string

  try {
    fileContents = fs.readFileSync(filename, 'utf-8')
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }
    throw error
  }

  const sourceUrl = getSourceMapUrl(fileContents)

  if (sourceUrl === null) {
    return null
  }

  if (sourceUrl.startsWith('data:')) {
    let buffer: dataUriToBuffer.MimeBuffer

    try {
      buffer = dataUriToBuffer(sourceUrl)
    } catch (error) {
      console.error(
        `Failed to parse source map URL for ${filename}.`,
        util.inspect(error, { customInspect: false })
      )
      return null
    }

    if (buffer.type !== 'application/json') {
      console.error(
        `Unknown source map type for ${filename}: ${buffer.typeFull}.`
      )
    }

    try {
      return JSON.parse(buffer.toString())
    } catch (error) {
      console.error(
        `Failed to parse source map for ${filename}.`,
        util.inspect(error, { customInspect: false })
      )
    }
  }

  const sourceMapFilename = path.resolve(path.dirname(filename), sourceUrl)

  try {
    const sourceMapContents = fs.readFileSync(sourceMapFilename, 'utf-8')

    return JSON.parse(sourceMapContents.toString())
  } catch (error) {
    console.error(
      `Failed to parse source map ${sourceMapFilename}.`,
      util.inspect(error, { customInspect: false })
    )
    return null
  }
}

function frameToString(frame: StackFrame): string {
  return frame.methodName
    ? `    at ${frame.methodName} (${frame.file}:${frame.lineNumber}:${frame.column})`
    : `    at ${frame.file}:${frame.lineNumber}:${frame.column}`
}

function parseAndSourceMap(error: Error): string {
  const stack = String(error.stack)
  let unparsedStack = stack

  let idx = unparsedStack.indexOf('react-stack-bottom-frame')
  if (idx !== -1) {
    idx = unparsedStack.lastIndexOf('\n', idx)
  }
  if (idx !== -1) {
    // Cut off everything after the bottom frame since it'll be internals.
    unparsedStack = unparsedStack.slice(0, idx)
  }

  const unsourcemappedStack = parseStack(unparsedStack)
  const sourcemapConsumers = new Map<string, SyncSourceMapConsumer>()

  const sourceMappedStack = unsourcemappedStack.map((frame) => {
    if (frame.file === null) {
      return frame
    }

    let sourcemap = sourcemapConsumers.get(frame.file)
    if (sourcemap === undefined) {
      const rawSourcemap = getSourceMapFromFile(frame.file)
      if (rawSourcemap === null) {
        return frame
      }
      sourcemap = new SyncSourceMapConsumer(rawSourcemap)
      sourcemapConsumers.set(frame.file, sourcemap)
    }

    const sourcePosition = sourcemap.originalPositionFor({
      column: frame.column ?? 0,
      line: frame.lineNumber ?? 1,
    })

    if (sourcePosition.source === null) {
      return frame
    }

    // TODO: Respect sourcemaps's ignoreList
    const sourceContent: string | null =
      sourcemap.sourceContentFor(
        sourcePosition.source,
        /* returnNullOnMissing */ true
      ) ?? null

    console.log({ sourceContent, sourcePosition })

    const originalFrame: StackFrame = {
      methodName:
        sourcePosition.name ||
        // default is not a valid identifier in JS so webpack uses a custom variable when it's an unnamed default export
        // Resolve it back to `default` for the method name if the source position didn't have the method.
        frame.methodName
          ?.replace('__WEBPACK_DEFAULT_EXPORT__', 'default')
          ?.replace('__webpack_exports__.', ''),
      column: sourcePosition.column,
      file: sourceContent
        ? // TODO:
          // ? path.relative(rootDirectory, filePath)
          sourcePosition.source
        : sourcePosition.source,
      lineNumber: sourcePosition.line,
      // TODO: c&p from async createOriginalStackFrame but why not frame.arguments?
      arguments: [],
    }

    return originalFrame
  })

  return `${error.message}\n${sourceMappedStack.map(frameToString).join('\n')}`
}

// @ts-expect-error
Error.prototype[inspectSymbol] = function (
  // can be ignored since also in inspectOptions
  depth: number,
  inspectOptions: util.InspectOptions,
  inspect: typeof util.inspect
): string {
  // Create a new Error object with the source mapping apply and then use native
  // Node.js formatting on the result.
  const newError =
    this.cause !== undefined
      ? // Setting an undefined `cause` would print `[cause]: undefined`
        new Error(this.message, { cause: this.cause })
      : new Error(this.message)

  // TODO: Ensure `class MyError extends Error {}` prints `MyError` as the name
  newError.stack = parseAndSourceMap(this)

  const originalCustomInspect = (newError as any)[inspectSymbol]
  // Prevent infinite recursion.
  // { customInspect: false } would result in `error.cause` not using our inspect.
  Object.defineProperty(newError, inspectSymbol, {
    value: undefined,
    enumerable: false,
    writable: true,
  })
  try {
    return inspect(newError, inspectOptions)
  } finally {
    ;(newError as any)[inspectSymbol] = originalCustomInspect
  }
}
