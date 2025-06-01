import { defineConfig } from "vite";
import typo3, {
    getDefaultIgnoreList,
    getDefaultAllowedOrigins,
} from "vite-plugin-typo3";

export default defineConfig({
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
