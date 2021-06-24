import { join } from 'path'
export const NEXT_PROJECT_ROOT = join(__dirname, '..', '..')
export const NEXT_PROJECT_ROOT_DIST = join(NEXT_PROJECT_ROOT, 'dist')
export const NEXT_PROJECT_ROOT_NODE_MODULES = join(
  NEXT_PROJECT_ROOT,
  'node_modules'
)
export const NEXT_PROJECT_ROOT_DIST_CLIENT = join(
  NEXT_PROJECT_ROOT_DIST,
  'client'
)
export const NEXT_PROJECT_ROOT_DIST_SERVER = join(
  NEXT_PROJECT_ROOT_DIST,
  'server'
)

// Regex for API routes
export const API_ROUTE = /^\/api(?:\/|$)/

// Because on Windows absolute paths in the generated code can break because of numbers, eg 1 in the path,
// we have to use a private alias
export const PAGES_DIR_ALIAS = 'private-next-pages'
export const DOT_NEXT_ALIAS = 'private-dot-next'

export const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`

export const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`

export const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`

export const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`

export const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`

export const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`

export const GSP_NO_RETURNED_VALUE =
  'Your `getStaticProps` function did not return an object. Did you forget to add a `return`?'
export const GSSP_NO_RETURNED_VALUE =
  'Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?'

export const UNSTABLE_REVALIDATE_RENAME_ERROR =
  'The `unstable_revalidate` property is available for general use.\n' +
  'Please use `revalidate` instead.'

export const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`

export const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`

export const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`

export const ESLINT_DEFAULT_DIRS = [
  'pages',
  'components',
  'lib',
  'src/pages',
  'src/components',
  'src/lib',
]

export const ESLINT_PROMPT = {
  type: 'select',
  name: 'option',
  message:
    'No ESLint configuration detected. How would you like to configure it?',
  choices: [
    {
      title: 'Strict (recommended)',
      description:
        'Select this option to use the base configuration with the Core Web Vitals rule-set.',
      value: {
        extends: ['next', 'next/core-web-vitals'],
      },
    },
    {
      title: 'Base',
      description: 'Select this option to use the base configuration.',
      value: {
        extends: 'next',
      },
    },
    {
      title: 'None',
      description:
        'Select this option if you would like to set up ESLint yourself',
      value: null,
    },
  ],
} as any
