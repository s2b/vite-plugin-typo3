import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
    FinalVitePluginTypo3Config,
    VitePluginTypo3Config,
} from "./types.js";

export function initializePluginConfig(
    userConfig: VitePluginTypo3Config,
    root?: string,
): FinalVitePluginTypo3Config {
    return {
        entrypointFile: "Configuration/ViteEntrypoints.json",
        entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
        composerRoot: determineComposerRoot(root ?? process.cwd()),
        ...userConfig,
    };
}

export function readJsonFile(file: string): any {
    return JSON.parse(readFileSync(file, "utf-8"));
}

export function isComposerRoot(file: string): boolean {
    const composerJson = readJsonFile(file);
    return composerJson.type === "project";
}

export function determineComposerRoot(current: string, root = current): string {
    const composerJson = join(current, "composer.json");
    if (existsSync(composerJson) && isComposerRoot(composerJson)) {
        return current;
    }
    const dir = dirname(current);
    // reach the fs root
    if (!dir || dir === current) {
        return root;
    }
    return determineComposerRoot(dir, root);
}
