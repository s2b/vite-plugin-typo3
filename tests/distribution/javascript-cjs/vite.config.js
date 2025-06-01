const defineConfig = require("vite").defineConfig;
const typo3 = require("vite-plugin-typo3").default;
const getDefaultAllowedOrigins =
    require("vite-plugin-typo3").getDefaultAllowedOrigins;
const getDefaultIgnoreList = require("vite-plugin-typo3").getDefaultIgnoreList;

module.exports = defineConfig({
    plugins: [typo3()],
    server: {
        cors: {
            origin: getDefaultAllowedOrigins(),
        },
        watch: {
            ignored: getDefaultIgnoreList(),
        },
    },
});
