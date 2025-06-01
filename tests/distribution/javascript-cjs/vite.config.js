const defineConfig = require("vite").defineConfig;
const typo3 = require("vite-plugin-typo3").default;
const getDefaultIgnoreList = require("vite-plugin-typo3").getDefaultIgnoreList;

module.exports = defineConfig({
    plugins: [typo3()],
    server: {
        watch: {
            ignored: getDefaultIgnoreList(),
        },
    },
});
