import { parse as parseStack } from 'stacktrace-parser'
import * as Bus from './internal/bus'

let isRegistered = false
let stackTraceLimit: number | undefined = undefined

function onUnhandledError(ev: ErrorEvent) {
  const error = ev?.error
  if (!error || !(error instanceof Error) || typeof error.stack !== 'string') {
    // A non-error was thrown, we don't have anything to show. :-(
    return
  }

  const e = error
  Bus.emit({
    type: Bus.TYPE_UNHANDLED_ERROR,
    reason: error,
    frames: parseStack(e.stack),
  })
}

function onUnhandledRejection(ev: PromiseRejectionEvent) {
  const reason = ev?.reason
  if (
    !reason ||
    !(reason instanceof Error) ||
    typeof reason.stack !== 'string'
  ) {
    // A non-error was thrown, we don't have anything to show. :-(
    return
  }

  const e = reason
  Bus.emit({
    type: Bus.TYPE_UNHANDLED_REJECTION,
    reason: reason,
    frames: parseStack(e.stack),
  })
}

function register() {
  if (isRegistered) {
    return
  }
  isRegistered = true

  try {
    const limit = Error.stackTraceLimit
    Error.stackTraceLimit = 50
    stackTraceLimit = limit
  } catch {}

  window.addEventListener('error', onUnhandledError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)
}

function unregister() {
  if (!isRegistered) {
    return
  }
  isRegistered = false

  if (stackTraceLimit !== undefined) {
    try {
      Error.stackTraceLimit = stackTraceLimit
    } catch {}
    stackTraceLimit = undefined
  }

  window.removeEventListener('error', onUnhandledError)
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
}

export { default as ReactDevOverlay } from './internal/overlay/ReactDevOverlay'
export { register, unregister }
