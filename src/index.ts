import autoOrigin from "vite-plugin-auto-origin";
import typo3composer from "./typo3composer.js"
import { VitePluginTypo3Config } from "./types.js";

export default function typo3(userConfig: VitePluginTypo3Config) {
    return [typo3composer(userConfig), autoOrigin()];
}
