import React, { useMemo } from 'react'
import { ACTION_UNHANDLED_ERROR, type OverlayState } from '../shared'

import { ShadowPortal } from '../internal/components/ShadowPortal'
import { BuildError } from '../internal/container/BuildError'
import { Errors } from '../internal/container/Errors'
import { StaticIndicator } from '../internal/container/StaticIndicator'
import type { SupportedErrorEvent } from '../internal/container/Errors'
import { parseStack } from '../internal/helpers/parse-stack'
import { Base } from '../internal/styles/Base'
import { ComponentStyles } from '../internal/styles/ComponentStyles'
import { CssReset } from '../internal/styles/CssReset'
import { RootLayoutMissingTagsError } from '../internal/container/root-layout-missing-tags-error'
import type { Dispatcher } from './hot-reloader-client'
import { getReactStitchedError } from '../internal/helpers/stitched-error'

interface ReactDevOverlayState {
  hasReactError: boolean // SupportedErrorEvent | null
}
export default class ReactDevOverlay extends React.PureComponent<
  {
    state: OverlayState
    dispatcher?: Dispatcher
    reactError?: unknown
    children: React.ReactNode
    onReactError: (error: Error) => void
  },
  ReactDevOverlayState
> {
  state = { hasReactError: false }


  static getDerivedStateFromError(error: Error): ReactDevOverlayState {
    if (!error.stack) return { hasReactError: false }

    return {
      hasReactError: true,
      // {
      //   id: 0,
      //   event: {
      //     type: ACTION_UNHANDLED_ERROR,
      //     reason: error,
      //     frames: parseStack(error.stack || ''),
      //   },
      // },
    }
  }

  componentDidCatch(componentErr: Error) {
    this.props.onReactError(componentErr)
  }

  render() {
    const { state, children, dispatcher, reactError: originReactError } = this.props
    const { hasReactError } = this.state
    // console.log('originReactError', originReactError)
    // @ts-ignore
    const reactError: SupportedErrorEvent | null = originReactError
      ? {
          id: 0,
          event: {
            type: ACTION_UNHANDLED_ERROR,
            reason: originReactError,
            frames: parseStack((originReactError as Error).stack || ''),
          },
        }
      : null

    const hasBuildError = state.buildError != null
    const hasRuntimeErrors = Boolean(state.errors.length)
    const hasStaticIndicator = state.staticIndicator
    const debugInfo = state.debugInfo

    console.log('state.errors', state.errors)

    return (
      <>
        {hasReactError ? (
          <html>
            <head></head>
            <body></body>
          </html>
        ) : (
          children
        )}
        <ShadowPortal>
          <CssReset />
          <Base />
          <ComponentStyles />
          {state.rootLayoutMissingTags?.length ? (
            <RootLayoutMissingTagsError
              missingTags={state.rootLayoutMissingTags}
            />
          ) : hasBuildError ? (
            <BuildError
              message={state.buildError!}
              versionInfo={state.versionInfo}
            />
          ) : (
            <>
              {(hasReactError && reactError) ? (
                <Errors
                  isAppDir={true}
                  versionInfo={state.versionInfo}
                  initialDisplayState="fullscreen"
                  errors={[reactError]}
                  hasStaticIndicator={hasStaticIndicator}
                  debugInfo={debugInfo}
                />
              ) : hasRuntimeErrors ? (
                <Errors
                  isAppDir={true}
                  initialDisplayState="minimized"
                  errors={state.errors}
                  versionInfo={state.versionInfo}
                  hasStaticIndicator={hasStaticIndicator}
                  debugInfo={debugInfo}
                />
              ) : null}

              {hasStaticIndicator && (
                <StaticIndicator dispatcher={dispatcher} />
              )}
            </>
          )}
        </ShadowPortal>
      </>
    )
  }
}
