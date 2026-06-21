// Registers loader.mjs as a custom ESM resolver for this Node process.
// Usage: `node --experimental-strip-types --import ./register.mjs <script.mjs>`
import { register } from "node:module"
import { pathToFileURL } from "node:url"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
register(pathToFileURL(join(here, "loader.mjs")).href, import.meta.url)
