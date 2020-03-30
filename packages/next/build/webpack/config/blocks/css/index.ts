import curry from 'next/dist/compiled/lodash.curry'
import path from 'path'
import webpack, { Configuration } from 'webpack'
import MiniCssExtractPlugin from '../../../plugins/mini-css-extract-plugin'
import { loader, plugin } from '../../helpers'
import { ConfigurationContext, ConfigurationFn, pipe } from '../../utils'
import { getCssModuleLoader, getGlobalCssLoader } from './loaders'
import {
  getCustomDocumentError,
  getGlobalImportError,
  getGlobalModuleImportError,
  getLocalModuleImportError,
} from './messages'
import { getPostCssPlugins } from './plugins'

// RegExps for all Style Sheet variants
const regexLikeCss = /\.(css|scss|sass)$/

// RegExps for Style Sheets
const regexCssGlobal = /(?<!\.module)\.css$/
const regexCssModules = /\.module\.css$/

// RegExps for Syntactically Awesome Style Sheets
const regexSassGlobal = /(?<!\.module)\.(scss|sass)$/
const regexSassModules = /\.module\.(scss|sass)$/

export const css = curry(async function css(
  enabled: boolean,
  scssEnabled: boolean,
  ctx: ConfigurationContext,
  config: Configuration
) {
  if (!enabled) {
    return config
  }

  const sassPreprocessors: webpack.RuleSetUseItem[] = [
    // First, process files with `sass-loader`: this inlines content, and
    // compiles away the proprietary syntax.
    {
      loader: require.resolve('sass-loader'),
      options: {
        // Source maps are required so that `resolve-url-loader` can locate
        // files original to their source directory.
        sourceMap: true,
        sassOptions: ctx.sassOptions,
      },
    },
    // Then, `sass-loader` will have passed-through CSS imports as-is instead
    // of inlining them. Because they were inlined, the paths are no longer
    // correct.
    // To fix this, we use `resolve-url-loader` to rewrite the CSS
    // imports to real file paths.
    {
      loader: require.resolve('resolve-url-loader'),
      options: {
        // Source maps are not required here, but we may as well emit
        // them.
        sourceMap: true,
      },
    },
  ]

  const fns: ConfigurationFn[] = [
    loader({
      oneOf: [
        {
          // Impossible regex expression
          test: /a^/,
          loader: 'noop-loader',
          options: { __next_css_remove: true },
        },
      ],
    }),
  ]

  const postCssPlugins = await getPostCssPlugins(
    ctx.rootDirectory,
    ctx.isProduction,
    // TODO: In the future, we should stop supporting old CSS setups and
    // unconditionally inject ours. When that happens, we should remove this
    // function argument.
    true
  )

  // CSS cannot be imported in _document. This comes before everything because
  // global CSS nor CSS modules work in said file.
  fns.push(
    loader({
      oneOf: [
        {
          test: regexLikeCss,
          // Use a loose regex so we don't have to crawl the file system to
          // find the real file name (if present).
          issuer: { test: /pages[\\/]_document\./ },
          use: {
            loader: 'error-loader',
            options: {
              reason: getCustomDocumentError(),
            },
          },
        },
      ],
    })
  )

  // CSS Modules support must be enabled on the server and client so the class
  // names are availble for SSR or Prerendering.
  fns.push(
    loader({
      oneOf: [
        {
          // CSS Modules should never have side effects. This setting will
          // allow unused CSS to be removed from the production build.
          // We ensure this by disallowing `:global()` CSS at the top-level
          // via the `pure` mode in `css-loader`.
          sideEffects: false,
          // CSS Modules are activated via this specific extension.
          test: regexCssModules,
          // CSS Modules are only supported in the user's application. We're
          // not yet allowing CSS imports _within_ `node_modules`.
          issuer: {
            include: [ctx.rootDirectory],
            exclude: /node_modules/,
          },
          use: getCssModuleLoader(ctx, postCssPlugins),
        },
      ],
    })
  )
  if (scssEnabled) {
    fns.push(
      loader({
        oneOf: [
          // Opt-in support for Sass (using .scss or .sass extensions).
          {
            // Sass Modules should never have side effects. This setting will
            // allow unused Sass to be removed from the production build.
            // We ensure this by disallowing `:global()` Sass at the top-level
            // via the `pure` mode in `css-loader`.
            sideEffects: false,
            // Sass Modules are activated via this specific extension.
            test: regexSassModules,
            // Sass Modules are only supported in the user's application. We're
            // not yet allowing Sass imports _within_ `node_modules`.
            issuer: {
              include: [ctx.rootDirectory],
              exclude: /node_modules/,
            },
            use: getCssModuleLoader(ctx, postCssPlugins, sassPreprocessors),
          },
        ],
      })
    )
  }

  // Throw an error for CSS Modules used outside their supported scope
  fns.push(
    loader({
      oneOf: [
        {
          test: [
            regexCssModules,
            (scssEnabled && regexSassModules) as RegExp,
          ].filter(Boolean),
          use: {
            loader: 'error-loader',
            options: {
              reason: getLocalModuleImportError(),
            },
          },
        },
      ],
    })
  )

  if (ctx.isServer) {
    fns.push(
      loader({
        oneOf: [
          {
            test: [
              regexCssGlobal,
              (scssEnabled && regexSassGlobal) as RegExp,
            ].filter(Boolean),
            use: require.resolve('ignore-loader'),
          },
        ],
      })
    )
  } else if (ctx.customAppFile) {
    fns.push(
      loader({
        oneOf: [
          {
            // A global CSS import always has side effects. Webpack will tree
            // shake the CSS without this option if the issuer claims to have
            // no side-effects.
            // See https://github.com/webpack/webpack/issues/6571
            sideEffects: true,
            test: regexCssGlobal,
            issuer: { include: ctx.customAppFile },
            use: getGlobalCssLoader(ctx, postCssPlugins),
          },
        ],
      })
    )
    if (scssEnabled) {
      fns.push(
        loader({
          oneOf: [
            {
              // A global Sass import always has side effects. Webpack will tree
              // shake the Sass without this option if the issuer claims to have
              // no side-effects.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
              test: regexSassGlobal,
              issuer: { include: ctx.customAppFile },
              use: getGlobalCssLoader(ctx, postCssPlugins, sassPreprocessors),
            },
          ],
        })
      )
    }
  }

  // Throw an error for Global CSS used inside of `node_modules`
  fns.push(
    loader({
      oneOf: [
        {
          test: [
            regexCssGlobal,
            (scssEnabled && regexSassGlobal) as RegExp,
          ].filter(Boolean),
          issuer: { include: [/node_modules/] },
          use: {
            loader: 'error-loader',
            options: {
              reason: getGlobalModuleImportError(),
            },
          },
        },
      ],
    })
  )

  // Throw an error for Global CSS used outside of our custom <App> file
  fns.push(
    loader({
      oneOf: [
        {
          test: [
            regexCssGlobal,
            (scssEnabled && regexSassGlobal) as RegExp,
          ].filter(Boolean),
          use: {
            loader: 'error-loader',
            options: {
              reason: getGlobalImportError(
                ctx.customAppFile &&
                  path.relative(ctx.rootDirectory, ctx.customAppFile)
              ),
            },
          },
        },
      ],
    })
  )

  if (ctx.isClient) {
    // Automatically transform references to files (i.e. url()) into URLs
    // e.g. url(./logo.svg)
    fns.push(
      loader({
        oneOf: [
          {
            // This should only be applied to CSS files
            issuer: { test: regexLikeCss },
            // Exclude extensions that webpack handles by default
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            use: {
              // `file-loader` always emits a URL reference, where `url-loader`
              // might inline the asset as a data URI
              loader: require.resolve('next/dist/compiled/file-loader'),
              options: {
                // Hash the file for immutable cacheability
                name: 'static/media/[name].[hash].[ext]',
              },
            },
          },
        ],
      })
    )
  }

  if (ctx.isClient && ctx.isProduction) {
    // Extract CSS as CSS file(s) in the client-side production bundle.
    fns.push(
      plugin(
        new MiniCssExtractPlugin({
          filename: 'static/css/[contenthash].css',
          chunkFilename: 'static/css/[contenthash].css',
          // Next.js guarantees that CSS order "doesn't matter", due to imposed
          // restrictions:
          // 1. Global CSS can only be defined in a single entrypoint (_app)
          // 2. CSS Modules generate scoped class names by default and cannot
          //    include Global CSS (:global() selector).
          //
          // While not a perfect guarantee (e.g. liberal use of `:global()`
          // selector), this assumption is required to code-split CSS.
          //
          // If this warning were to trigger, it'd be unactionable by the user,
          // but also not valid -- so we disable it.
          ignoreOrder: true,
        })
      )
    )
  }

  const fn = pipe(...fns)
  return fn(config)
})
