import { useFlushEffects } from 'next/streaming'
import React from 'react'

class ErrorBoundary extends React.Component {
  state = {}

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    return this.state.error ? (
      <span id="error">{this.state.error.message}</span>
    ) : (
      this.props.children
    )
  }
}

function Component() {
  useFlushEffects([])
  return null
}

export default function Client() {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  )
}
