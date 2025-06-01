import { defineConfig } from "vite";
import typo3, { getDefaultIgnoreList } from "vite-plugin-typo3";

export default defineConfig({
    plugins: [typo3()],
    server: {
        watch: {
            ignored: getDefaultIgnoreList(),
        },
    },
});
