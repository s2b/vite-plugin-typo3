import type { UserConfig } from "./types.js";
import autoOrigin from "vite-plugin-auto-origin";
import typo3project from "./typo3project.js";
import typo3extension from "./typo3extension.js";

export default function typo3(userConfig: UserConfig = {}) {
    return [typo3project(userConfig), typo3extension(userConfig), autoOrigin()];
}
