import { FlightRouterState, Segment } from '../../../server/app-render/types'
import { INTERCEPTION_ROUTE_MARKERS } from '../../../server/future/helpers/interception-routes'
import { isGroupSegment, matchSegment } from '../match-segments'

const segmentToPathname = (segment: Segment): string => {
  if (typeof segment === 'string') {
    return segment
  }

  return segment[1]
}

function normalizeSegments(segments: string[]): string {
  return (
    segments.reduce((acc, segment) => {
      if (segment === '' || isGroupSegment(segment)) {
        return acc
      }

      return `${acc}/${segment}`
    }, '') || '/'
  )
}

export function extractPathFromFlightRouterState(
  flightRouterState: FlightRouterState
): string | undefined {
  const segment = Array.isArray(flightRouterState[0])
    ? flightRouterState[0][1]
    : flightRouterState[0]

  if (
    segment === '__DEFAULT__' ||
    INTERCEPTION_ROUTE_MARKERS.some((m) => segment.startsWith(m))
  )
    return undefined

  if (segment.startsWith('__PAGE__')) return ''

  const segments = [segment]
  const parallelRoutes = flightRouterState[1] ?? {}

  const childrenPath = parallelRoutes.children
    ? extractPathFromFlightRouterState(parallelRoutes.children)
    : undefined

  if (childrenPath !== undefined) {
    segments.push(childrenPath)
  } else {
    for (const [key, value] of Object.entries(parallelRoutes)) {
      if (key === 'children') continue

      const childPath = extractPathFromFlightRouterState(value)

      if (childPath !== undefined) {
        segments.push(childPath)
      }
    }
  }

  return normalizeSegments(segments)
}

function computeChangedPathImpl(
  treeA: FlightRouterState,
  treeB: FlightRouterState
): string | null {
  const [segmentA, parallelRoutesA] = treeA
  const [segmentB, parallelRoutesB] = treeB

  const normalizedSegmentA = segmentToPathname(segmentA)
  const normalizedSegmentB = segmentToPathname(segmentB)

  if (
    INTERCEPTION_ROUTE_MARKERS.some(
      (m) =>
        normalizedSegmentA.startsWith(m) || normalizedSegmentB.startsWith(m)
    )
  ) {
    return ''
  }

  if (!matchSegment(segmentA, segmentB)) {
    // once we find where the tree changed, we compute the rest of the path by traversing the tree
    return extractPathFromFlightRouterState(treeB) ?? ''
  }

  for (const parallelRouterKey in parallelRoutesA) {
    if (parallelRoutesB[parallelRouterKey]) {
      const changedPath = computeChangedPathImpl(
        parallelRoutesA[parallelRouterKey],
        parallelRoutesB[parallelRouterKey]
      )
      if (changedPath !== null) {
        return `${segmentToPathname(segmentB)}/${changedPath}`
      }
    }
  }

  return null
}

export function computeChangedPath(
  treeA: FlightRouterState,
  treeB: FlightRouterState
): string | null {
  const changedPath = computeChangedPathImpl(treeA, treeB)

  if (changedPath == null || changedPath === '/') {
    return changedPath
  }

  // lightweight normalization to remove route groups
  return normalizeSegments(changedPath.split('/'))
}
