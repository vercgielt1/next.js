import type * as NodeUtil from 'node:util'

export function setupErrorInspection() {
  // TODO: Edge runtime?

  const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')

  class SourceMappedError extends Error {
    // Disable the one we're setting on the Error prototype to avoid recursion.
    static [inspectSymbol] = undefined
  }

  const originalInit = Error.prototype[inspectSymbol]
  // @ts-expect-error
  Error.prototype[inspectSymbol as any] = function (
    depth: number,
    inspectOptions: NodeUtil.InspectOptions,
    inspect: typeof NodeUtil.inspect
  ) {
    // Create a new Error object with the source mapping apply and then use native
    // Node.js formatting on the result.
    const newError = new SourceMappedError(this.message)
    newError.stack = parseAndSourceMap(String(this.stack))
    return inspect(newError, inspectOptions)
  }
}
