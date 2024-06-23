if (
  process.env.NEXT_RUNTIME === 'nodejs' &&
  process.env.EXPERIMENTAL_NODE_STREAMS_SUPPORT === '1'
) {
  module.exports = require('next/dist/server/stream-utils/stream-utils.node.js')
} else {
  module.exports = require('next/dist/server/stream-utils/stream-utils.edge.js')
}
