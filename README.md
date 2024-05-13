# TYPO3 Vite Plugin

This vite plugin collects entrypoints from TYPO3 extensions in a composer-based
TYPO3 setup.

**Please note that this is still under development and might introduce breaking
changes anytime!**

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

See [types.ts](./src/types.ts) for all available plugin options.

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
