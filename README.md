# TYPO3 Vite Plugin

This vite plugin collects entrypoints from TYPO3 extensions in a composer-based
TYPO3 setup.

## Installation

```sh
npm install --save-dev vite-plugin-typo3
```

This plugin is intended to be used together with
**[vite_asset_collector](https://github.com/s2b/vite-asset-collector)**.

## Setup

Setup vite in your TYPO3 project:

**vite.config.js:**

```js
import { defineConfig } from "vite";
import typo3 from "vite-plugin-typo3";

export default defineConfig({
    plugins: [typo3()],
});
```

Provide entrypoints from an installed TYPO3 extension:

**EXT:my_extension/Configuration/ViteEntrypoints.json:**

```json
[
    "../Resources/Private/JavaScript/Main.entry.js",
    "../Resources/Private/Entrypoints/*.entry.js"
]
```

Wildcards are possible, relative paths are relative to the location of the json file.

## Configuration

### Vite Configuration

The plugin tries to be as unintrusive as possible by only setting configuration
values if they haven't been set already by the user. For example, if you want to
use a custom manifest file name, you can set it as usual in your **vite.config.js**:

```js
export default defineConfig({
    plugins: [typo3()],
    build: {
        manifest: ".vite/custom-manifest-name.json",
    },
});
```

### Plugin Configuration

You can provide additional configuration to the plugin, for example:

```js
    plugins: [typo3({ debug: true })],
```

-   `target` (string, default `project`): If set to `extension`, vite can be used to bundle
    asset files for a singular TYPO3 extension. By default, they will be put into
    `Resources/Public/Vite/` and retain their original file names. For JS files, both ESM and CJS
    variants will be generated. This mode can only be used with `vite build`, not with the dev
    server.
-   `debug` (boolean, default `false`): Show TYPO3-related debugging information in vite's
    cli output
-   `entrypointFile` (string, default `Configuration/ViteEntrypoints.json`): Use a different
    file to provide entrypoints from extensions.
-   `entrypointIgnorePatterns` (array, default: `["**/node_modules/**", "**/.git/**"]`): Files
    that should be ignored when using wildcards in `ViteEntrypoints.json`.

### Fixing CORS issues

Version 2 of this vite plugin comes with a strict
[CORS configuration](https://vite.dev/config/server-options.html#server-cors) for the vite
dev server. By default, only the following domains and IPs can access the server to prevent
security issues:

* localhost
* 127.0.0.1
* ::1
* *.ddev.site

Depending on your local development setup, it might be necessary to modify this list. The
default configuration is exposed as a separate function to be used in your project's
`vite.config.js`:

```js
import typo3, { getDefaultAllowedOrigins } from "vite-plugin-typo3"

export default defineConfig({
    plugins: [ typo3() ],
    server: {
        cors: {
            origin: [
                ...getDefaultAllowedOrigins(),
                /^https?:\/\/.*\.domain\.tld(:\d+)?$/,
            ],
        },
    },
});
```

### Extending Watcher Ignore List

The plugin comes with a reasonable list of files that should be ignored by the vite watcher
process, which can speed up local development considerably. In some circumstances, it might be
helpful to extend this list. For that purpose, the default list is exposed as a separate
function to be used directly in the project's `vite.config.js` file. The following example
would skip any html files in the project, while retaining the default ignores:

```js
import typo3, { getDefaultIgnoreList } from "vite-plugin-typo3"

export default defineConfig({
    plugins: [ typo3() ],
    server: {
        watch: {
            ignored: [
                ...getDefaultIgnoreList(),
                "**/*.html",
            ],
        },
    },
});
