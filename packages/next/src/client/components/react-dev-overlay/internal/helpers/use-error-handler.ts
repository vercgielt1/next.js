import { useEffect, useSyncExternalStore } from 'react'
import { attachHydrationErrorState } from './attach-hydration-error-state'
import { isNextRouterError } from '../../../is-next-router-error'
import { storeHydrationErrorStateFromConsoleArgs } from './hydration-error-info'
import { formatConsoleArgs } from '../../../../lib/console'
import isError from '../../../../../lib/is-error'
import { ConsoleError } from './console-error'
import { enqueueConsecutiveDedupedError } from './enqueue-client-error'

export type ErrorHandler = (error: Error) => void

const errorQueue: Array<Error> = []
const errorHandlers: Array<ErrorHandler> = []
const rejectionQueue: Array<Error> = []
const rejectionHandlers: Array<ErrorHandler> = []
let errorsBeforeHandlerReady: Array<Error> = []

let listeners: any[] = []
const errorsBeforeHandlerReadyStore = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener]
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  getState() {
    return errorsBeforeHandlerReady
  },
  addItem(item: Error) {
    errorsBeforeHandlerReady = [...errorsBeforeHandlerReady, item]
    for (const listener of listeners) {
      listener()
    }
  }
}


export function handleClientError(
  originError: unknown,
  consoleErrorArgs: any[]
) {
  let error: Error
  if (!originError || !isError(originError)) {
    // If it's not an error, format the args into an error
    const formattedErrorMessage = formatConsoleArgs(consoleErrorArgs)
    error = new ConsoleError(formattedErrorMessage)
  } else {
    error = originError
  }

  storeHydrationErrorStateFromConsoleArgs(...consoleErrorArgs)
  attachHydrationErrorState(error)

  enqueueConsecutiveDedupedError(errorQueue, error)
  for (const handler of errorHandlers) {
    handler(error)
  }
}

export function useErrorHandler(
  handleOnUnhandledError: ErrorHandler,
  handleOnUnhandledRejection: ErrorHandler,
  forceUpdate: () => void
) {
  useEffect(() => {
    // Handle queued errors.
    errorQueue.forEach(handleOnUnhandledError)
    rejectionQueue.forEach(handleOnUnhandledRejection)

    // Listen to new errors.
    errorHandlers.push(handleOnUnhandledError)
    rejectionHandlers.push(handleOnUnhandledRejection)

    return () => {
      // Remove listeners.
      errorHandlers.splice(errorHandlers.indexOf(handleOnUnhandledError), 1)
      rejectionHandlers.splice(
        rejectionHandlers.indexOf(handleOnUnhandledRejection),
        1
      )
    }
  }, [handleOnUnhandledError, handleOnUnhandledRejection])

  // const pendingErrors = useSyncExternalStore(
  //   errorsBeforeHandlerReadyStore.subscribe,
  //   errorsBeforeHandlerReadyStore.getState,
  //   () => undefined,
  // )
  
}

function subscribeErrors() {
  function onUnhandledError(event: WindowEventMap['error']): void | boolean {
    if (isNextRouterError(event.error)) {
      event.preventDefault()
      return false
    }
    handleClientError(event.error, [])
  }

  function onUnhandledRejection(ev: WindowEventMap['unhandledrejection']): void {
    const reason = ev?.reason
    if (isNextRouterError(reason)) {
      ev.preventDefault()
      return
    }

    if (
      !reason ||
      !(reason instanceof Error) ||
      typeof reason.stack !== 'string'
    ) {
      // A non-error was thrown, we don't have anything to show. :-(
      return
    }

    const e = reason
    rejectionQueue.push(e)
    for (const handler of rejectionHandlers) {
      handler(e)
    }
  }


  window.addEventListener(
    'error',
    onUnhandledError
  )

  window.addEventListener(
    'unhandledrejection',
    onUnhandledRejection
  )

  return () => {
    window.removeEventListener('error', onUnhandledError)
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }
}

export function handleGlobalErrors() {
  if (typeof window !== 'undefined') {
    try {
      // Increase the number of stack frames on the client
      Error.stackTraceLimit = 50
    } catch {}

    subscribeErrors()    
  }
}
