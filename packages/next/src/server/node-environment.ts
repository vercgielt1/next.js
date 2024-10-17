// This file should be imported before any others. It sets up the environment
// for later imports to work properly.

// Improve Error first so that errors from other extensions are improved.
import './node-environment-extensions/error-inspect'

import './node-environment-baseline'
import './node-environment-extensions/random'
import './node-environment-extensions/date'
import './node-environment-extensions/web-crypto'
import './node-environment-extensions/node-crypto'
