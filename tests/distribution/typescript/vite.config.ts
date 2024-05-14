import { defineConfig } from "vite";
import typo3 from "vite-plugin-typo3";

export default defineConfig({
    plugins: [typo3()],
});
