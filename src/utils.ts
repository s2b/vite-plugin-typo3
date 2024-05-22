import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
    ComposerContext,
    PluginConfig,
    VitePluginTarget,
    UserConfig,
    Typo3ExtensionInfo,
} from "./types.js";
import type { InputOption } from "rollup";
import { AliasOptions, Logger } from "vite";
import fg from "fast-glob";
import colors from "picocolors";

export function initializePluginConfig(
    userConfig: UserConfig,
    root?: string,
): PluginConfig {
    const composerChain = collectComposerChain(root ?? process.cwd());
    const composerContext = determineComposerContext(composerChain, userConfig.target);
    if (!composerContext) {
        throw new Error(
            `No composer.json file could be found in parent directories.`,
        );
    }

    return {
        entrypointFile: "Configuration/ViteEntrypoints.json",
        entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
        debug: false,
        ...userConfig,
        target: composerContext.type as VitePluginTarget,
        composerContext: composerContext,
    };
}

export function collectComposerChain(
    path: string,
    root = path,
): ComposerContext[] {
    let contexts: ComposerContext[] = [];

    // Check if composer file exists in current dir
    const composerFile = join(path, "composer.json");
    if (existsSync(composerFile)) {
        const composerJson = readJsonFile(composerFile);
        contexts.push({
            type: composerJson.type ?? "library",
            path,
            content: composerJson,
        });

        // No need to check further if we already found a project root
        if (composerJson.type === "project") {
            return contexts;
        }
    }

    // Check parent dirs recursively
    const parent = dirname(path);
    if (parent && parent !== path) {
        contexts = contexts.concat(collectComposerChain(parent, root));
    }

    return contexts;
}

export function determineComposerContext(chain: ComposerContext[], type?: string): ComposerContext | undefined {
    if (type) {
        return chain.find(
            (context) => context.type === type,
        );
    } else {
        return chain.find(
            (context) => context.type === "project",
        ) ?? chain.find(
            (context) => context.type === "typo3-cms-extension",
        );
    }
}

export function findEntrypointsInExtensions(
    extensions: Typo3ExtensionInfo[],
    pluginConfig: PluginConfig,
): string[] {
    let entrypoints: string[] = [];
    extensions.forEach((extension) => {
        const entrypointFile = join(
            extension.path,
            pluginConfig.entrypointFile,
        );
        const patterns = readJsonFile(entrypointFile).map((pattern: string) =>
            resolve(dirname(entrypointFile), pattern),
        );
        entrypoints = entrypoints.concat(
            fg.sync(patterns, {
                cwd: dirname(entrypointFile),
                ignore: pluginConfig.entrypointIgnorePatterns,
                absolute: true,
            }),
        );
    });
    return entrypoints;
}

export function outputDebugInformation(
    relevantExtensions: Typo3ExtensionInfo[],
    entrypoints: string[],
    pluginConfig: PluginConfig,
    logger: Logger,
): void {
    if (relevantExtensions.length) {
        const extensionList = relevantExtensions.map(
            (extension) => extension.key,
        );
        const aliasList = extensionList.map(
            (extensionKey) => "@" + extensionKey,
        );
        logger.info(
            `The following extensions with vite entrypoints have been recognized: ${colors.green(extensionList.join(", "))}`,
            { timestamp: true },
        );
        logger.info(
            `The following aliases have been defined: ${colors.green(aliasList.join(", "))}`,
            { timestamp: true },
        );
    }

    if (entrypoints.length) {
        const entrypointList = entrypoints.map((path) =>
            path.replace(pluginConfig.composerContext.path + "/", ""),
        );
        logger.info(
            `The following entrypoints will be served:\n` +
                colors.green("➜ " + entrypointList.join("\n➜ ")),
            { timestamp: true },
        );
    }
}

export function addRollupInputs(
    input: InputOption | undefined,
    additionalInputs: string[],
): InputOption {
    // Prevent empty input, which would trigger index.html fallback by vite
    input ??= [];
    if (typeof input === "string") {
        input = [input].concat(additionalInputs);
    } else if (Array.isArray(input)) {
        input = input.concat(additionalInputs);
    } else {
        input = { ...input, ...additionalInputs };
    }
    return input;
}

export function addAliases(
    alias: AliasOptions | undefined,
    extensions: Typo3ExtensionInfo[],
): AliasOptions {
    return {
        ...alias,
        ...extensions.map((extension) => ({
            find: "@" + extension.key,
            replacement: extension.path,
        })),
    };
}

export function readJsonFile(file: string): any {
    return JSON.parse(readFileSync(file, "utf-8"));
}
