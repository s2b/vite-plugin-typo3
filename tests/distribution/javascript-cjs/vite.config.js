const defineConfig = require("vite").defineConfig;
const typo3 = require("vite-plugin-typo3").default;

module.exports = defineConfig({
    plugins: [typo3()],
});
