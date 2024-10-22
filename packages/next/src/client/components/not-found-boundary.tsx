'use client'

import React, { useContext } from 'react'
import { useUntrackedPathname } from './navigation-untracked'
import { isNotFoundError } from './not-found'
import { warnOnce } from '../../shared/lib/utils/warn-once'
import { MissingSlotContext } from '../../shared/lib/app-router-context.shared-runtime'

interface NotFoundBoundaryProps {
  notFound?: React.ReactNode
  notFoundStyles?: React.ReactNode
  asNotFound?: boolean
  children: React.ReactNode
  missingSlots?: Set<string>
}

interface NotFoundErrorBoundaryProps extends NotFoundBoundaryProps {
  pathname: string | null
  missingSlots?: Set<string>
}

interface NotFoundErrorBoundaryState {
  notFoundTriggered: boolean
  previousPathname: string | null
}

class NotFoundErrorBoundary extends React.Component<
  NotFoundErrorBoundaryProps,
  NotFoundErrorBoundaryState
> {
  constructor(props: NotFoundErrorBoundaryProps) {
    super(props)
    this.state = {
      notFoundTriggered: !!props.asNotFound,
      previousPathname: props.pathname,
    }
  }

  componentDidCatch(): void {
    if (
      process.env.NODE_ENV === 'development' &&
      this.props.missingSlots &&
      // A missing children slot is the typical not-found case, so no need to warn
      !this.props.missingSlots.has('children')
    ) {
      let warningMessage =
        'No default component was found for a parallel route rendered on this page. Falling back to nearest NotFound boundary.\n' +
        'Learn more: https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#defaultjs\n\n'

      if (this.props.missingSlots.size > 0) {
        const formattedSlots = Array.from(this.props.missingSlots)
          .sort((a, b) => a.localeCompare(b))
          .map((slot) => `@${slot}`)
          .join(', ')

        warningMessage += 'Missing slots: ' + formattedSlots
      }

      warnOnce(warningMessage)
    }
  }

  static getDerivedStateFromError(error: any) {
    if (isNotFoundError(error)) {
      return {
        notFoundTriggered: true,
      }
    }
    // Re-throw if error is not for 404
    throw error
  }

  static getDerivedStateFromProps(
    props: NotFoundErrorBoundaryProps,
    state: NotFoundErrorBoundaryState
  ): NotFoundErrorBoundaryState | null {
    /**
     * Handles reset of the error boundary when a navigation happens.
     * Ensures the error boundary does not stay enabled when navigating to a new page.
     * Approach of setState in render is safe as it checks the previous pathname and then overrides
     * it as outlined in https://react.dev/reference/react/useState#storing-information-from-previous-renders
     */
    if (props.pathname !== state.previousPathname && state.notFoundTriggered) {
      return {
        notFoundTriggered: false,
        previousPathname: props.pathname,
      }
    }
    return {
      notFoundTriggered: state.notFoundTriggered,
      previousPathname: props.pathname,
    }
  }

  render() {
    if (this.state.notFoundTriggered) {
      // the order of rendering of these elements matters because InnerScrollAndFocusHandler
      // finds the first element being rendered in handlePotentialScroll function
      // if <meta> is rendered first, then scrolling on client side navigation will not happen
      // props.notFound should always be rendered first
      return (
        <>
          {this.props.notFound}
          <meta name="robots" content="noindex" />
          {process.env.NODE_ENV === 'development' && (
            <meta name="next-error" content="not-found" />
          )}
          {this.props.notFoundStyles}
        </>
      )
    }

    return this.props.children
  }
}

export function NotFoundBoundary({
  notFound,
  notFoundStyles,
  asNotFound,
  children,
}: NotFoundBoundaryProps) {
  // When we're rendering the missing params shell, this will return null. This
  // is because we won't be rendering any not found boundaries or error
  // boundaries for the missing params shell. When this runs on the client
  // (where these error can occur), we will get the correct pathname.
  const pathname = useUntrackedPathname()
  const missingSlots = useContext(MissingSlotContext)

  if (notFound) {
    return (
      <NotFoundErrorBoundary
        pathname={pathname}
        notFound={notFound}
        notFoundStyles={notFoundStyles}
        asNotFound={asNotFound}
        missingSlots={missingSlots}
      >
        {children}
      </NotFoundErrorBoundary>
    )
  }

  return <>{children}</>
}
