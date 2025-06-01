import autoOrigin from "vite-plugin-auto-origin";
import type { UserConfig } from "./types.js";
import typo3project from "./typo3project.js";
import typo3extension from "./typo3extension.js";
import { PluginOption } from "vite";
import { getDefaultIgnoreList, getDefaultAllowedOrigins } from "./utils.js";

export default function typo3(userConfig: UserConfig = {}): PluginOption[] {
    if (userConfig.target === "extension") {
        return [typo3extension(userConfig)];
    } else {
        return [typo3project(userConfig), autoOrigin()];
    }
}

export { getDefaultIgnoreList, getDefaultAllowedOrigins };
