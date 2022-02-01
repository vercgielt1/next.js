import { useEffect, useRef } from 'react'
import { NextWebVitalsMetric } from '../pages/_app'

type ReportWebVitalsCallback = (webVitals: NextWebVitalsMetric) => any
export const webVitalsCallbacks = new Set<ReportWebVitalsCallback>()
export const bufferedVitalsMetrics: NextWebVitalsMetric[] = []

export function trackWebVitalMetric(metric: NextWebVitalsMetric) {
  bufferedVitalsMetrics.push(metric)
  webVitalsCallbacks.forEach((callback) => callback(metric))
}

export function useWebVitalsReport(callback: ReportWebVitalsCallback) {
  const metricIndexRef = useRef(0)

  useEffect(() => {
    // Flush calculated metrics
    const reportMetric = (metric: NextWebVitalsMetric) => {
      callback(metric)
      metricIndexRef.current = bufferedVitalsMetrics.length
    }
    for (
      let i = metricIndexRef.current;
      i < bufferedVitalsMetrics.length;
      i++
    ) {
      reportMetric(bufferedVitalsMetrics[i])
    }

    webVitalsCallbacks.add(reportMetric)
    return () => {
      webVitalsCallbacks.delete(reportMetric)
    }
  }, [callback])

  // Flush buffer on mount
  useEffect(() => {
    bufferedVitalsMetrics.length = 0
    metricIndexRef.current = 0
  }, [])
}
