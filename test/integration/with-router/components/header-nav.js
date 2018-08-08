import * as React from 'react'
import Router, { withRouter } from 'next/router'
import Link from 'next/link'

const pages = {
  '/a': 'Foo',
  '/b': 'Bar'
}

class HeaderNav extends React.Component {
  constructor ({ router }) {
    super()

    this.state = {
      activeURL: router.asPath,
      activeURLTopLevelRouterDeprecatedBehavior: router.asPath,
      activeURLTopLevelRouter: router.asPath,
      title: null
    }
  }

  componentDidMount () {
    Router.onRouteChangeComplete = this.handleRouteChangeTopLevelRouterDeprecatedBehavior
    Router.events.on('routeChangeComplete', this.handleRouteChangeTopLevelRouter)
    this.props.router.events.on('routeChangeComplete', this.handleRouteChange)
  }

  componentWillUnmount () {
    Router.onRouteChangeComplete = null
    Router.events.on('routeChangeComplete', this.handleRouteChangeTopLevelRouter)
    this.props.router.events.off('routeChangeComplete', this.handleRouteChange)
  }

  handleRouteChange = url => {
    this.setState({
      activeURL: url,
      title: window.document.title
    })
  };

  handleRouteChangeTopLevelRouter = url => {
    this.setState({
      activeURLTopLevelRouter: url
    })
  };

  handleRouteChangeTopLevelRouterDeprecatedBehavior = url => {
    this.setState({
      activeURLTopLevelRouterDeprecatedBehavior: url
    })
  };

  render () {
    return (
      <nav>
        {
          Object.keys(pages).map(url => (
            <Link href={url} key={url} prefetch>
              <a className={`${this.state.activeURL === url ? 'active' : ''} ${this.state.activeURLTopLevelRouter === url ? 'active-top-level-router' : ''} ${this.state.activeURLTopLevelRouterDeprecatedBehavior === url ? 'active-top-level-router-deprecated-behavior' : ''}`}>
                { pages[url] }
              </a>
            </Link>
          ))
        }

        <div className='title'>{this.state.title}</div>
      </nav>
    )
  }
}

export default withRouter(HeaderNav)
