import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { InputOption } from "rollup";
import {
    type Alias,
    type AliasOptions,
    type Logger,
    defaultAllowedOrigins,
} from "vite";
import { globSync } from "tinyglobby";
import colors from "picocolors";
import type {
    ComposerContext,
    PluginConfig,
    PluginTarget,
    UserConfig,
    Typo3ProjectContext,
    Typo3ExtensionContext,
    AliasConfig,
} from "./types.js";

export function initializePluginConfig<T extends ComposerContext>(
    userConfig: UserConfig,
    root: string,
): PluginConfig<T> {
    const target = userConfig.target ?? "project";

    const composerContext = determineComposerContext<T>(
        target,
        collectComposerChain(root),
    );
    if (!composerContext) {
        const message =
            target === "project"
                ? 'No composer project could be found in parent directories. Make sure to set "type": "project" in your root composer.json.'
                : "No extension composer file could be found in parent directories. Make sure that your extension has a valid composer file.";
        throw new Error(message);
    }

    return {
        target,
        entrypointFile: "Configuration/ViteEntrypoints.json",
        entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
        debug: false,
        composerContext,
        aliases: true,
        ...userConfig,
    };
}

export function collectComposerChain(path: string): ComposerContext[] {
    let contexts: ComposerContext[] = [];

    // Check if composer file exists in current dir
    const composerFile = join(path, "composer.json");
    if (fs.existsSync(composerFile)) {
        const composerJson = readJsonFile(composerFile);
        const composerContext = createComposerContext(composerJson, path);
        contexts.push(composerContext);

        // No need to check further if we already found a project root
        if (composerContext.type === "project") {
            return contexts;
        }
    }

    // Check parent dirs recursively
    const parent = dirname(path);
    if (parent && parent !== path) {
        contexts = contexts.concat(collectComposerChain(parent));
    }

    return contexts;
}

export function createComposerContext(
    json: any,
    path: string,
): ComposerContext {
    switch (json.type) {
        case "project":
            return {
                type: "project",
                path,
                vendorDir: json.config?.["vendor-dir"] ?? "vendor",
                webDir: json.extra?.["typo3/cms"]?.["web-dir"] ?? "public",
            };

        case "typo3-cms-extension":
            return {
                type: "typo3-cms-extension",
                path,
                extensionKey:
                    json.extra?.["typo3/cms"]?.["extension-key"] ?? "",
            };

        default:
            return {
                type: json.type ?? "library",
                path,
            };
    }
}

export function determineComposerContext<T extends ComposerContext>(
    target: PluginTarget,
    chain: ComposerContext[],
): T | undefined {
    const type = target === "extension" ? "typo3-cms-extension" : target;
    return chain.find(
        (context: ComposerContext): context is T => context.type === type,
    );
}

export function findEntrypointsInExtensions(
    extensions: Typo3ExtensionContext[],
    entrypointFile: string,
    entrypointIgnorePatterns: string[],
): string[] {
    let entrypoints: string[] = [];
    extensions.forEach((extension) => {
        const file = join(extension.path, entrypointFile);
        if (!fs.existsSync(file)) {
            return;
        }
        const patterns = readJsonFile(file).map((pattern: string) =>
            resolve(dirname(file), pattern),
        );
        entrypoints = entrypoints.concat(
            globSync(patterns, {
                cwd: dirname(file),
                ignore: entrypointIgnorePatterns,
                absolute: true,
                expandDirectories: false,
            }),
        );
    });
    return entrypoints;
}

export function determineAvailableTypo3ExtensionsFromComposer(
    composerContext: Typo3ProjectContext,
): Typo3ExtensionContext[] {
    const composerInstalled = join(
        composerContext.path,
        composerContext.vendorDir,
        "composer/installed.json",
    );
    if (!fs.existsSync(composerInstalled)) {
        throw new Error(
            `Unable to read composer package information from "${composerInstalled}". Try executing "composer install".`,
        );
    }

    const installedPackages = readJsonFile(composerInstalled);
    if (!installedPackages.packages) {
        throw new Error(
            `Invalid composer state in  "${composerInstalled}". Try executing "composer install".`,
        );
    }

    const installedExtensions: Typo3ExtensionContext[] =
        installedPackages.packages
            .filter(
                (extension: any) => extension?.type === "typo3-cms-extension",
            )
            .map((extension: any) =>
                createComposerContext(
                    extension,
                    resolve(
                        dirname(composerInstalled),
                        extension["install-path"],
                    ),
                ),
            );

    return installedExtensions;
}

export function determineAvailableTypo3ExtensionsFromPaths(
    rootPath: string,
    composerPackagePaths: string[],
): Typo3ExtensionContext[] {
    return composerPackagePaths
        .map((path: string) => resolve(rootPath, path))
        .map((absolutePath: string) => {
            const composerFile = absolutePath + "/composer.json";
            if (!fs.existsSync(composerFile)) {
                throw new Error(
                    `Invalid composer package in "${absolutePath}", composer.json not found.`,
                );
            }
            return createComposerContext(
                readJsonFile(composerFile),
                absolutePath,
            );
        })
        .filter(
            (context: ComposerContext) =>
                context.type === "typo3-cms-extension",
        ) as Typo3ExtensionContext[];
}

export function outputDebugInformation(
    availableExtensions: Typo3ExtensionContext[],
    entrypoints: string[],
    composerContext: ComposerContext,
    logger: Logger,
    aliasConfig: AliasConfig = true,
): void {
    if (availableExtensions.length) {
        const extensionList = availableExtensions.map(
            (extension) => extension.extensionKey,
        );
        const aliasList = createAliases(availableExtensions, aliasConfig).map(
            (alias) => alias.find,
        );
        logger.info(
            `The following TYPO3 extensions have been recognized: ${colors.green(extensionList.join(", "))}`,
            { timestamp: true },
        );
        logger.info(
            `The following aliases have been defined: ${colors.green(aliasList.join(", "))}`,
            { timestamp: true },
        );
    }

    if (entrypoints.length) {
        const entrypointList = entrypoints.map((path) =>
            path.replace(composerContext.path + "/", ""),
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
    extensions: Typo3ExtensionContext[],
    config: AliasConfig = true,
): AliasOptions {
    alias ??= [];
    if (!Array.isArray(alias)) {
        alias = Object.entries(alias).map((entry) => ({
            find: entry[0],
            replacement: entry[1],
        }));
    }
    return alias.concat(createAliases(extensions, config));
}

export function createAliases(
    extensions: Typo3ExtensionContext[],
    config: AliasConfig,
) {
    if (config === false) {
        return [];
    }
    return extensions.reduce((aliases: Alias[], extension) => {
        const replacement = extension.path.endsWith("/")
            ? extension.path
            : extension.path + "/";
        if (config === "@" || config === true) {
            aliases.push({ find: "@" + extension.extensionKey, replacement });
        }
        if (config === "EXT" || config === true) {
            aliases.push({
                find: "EXT:" + extension.extensionKey,
                replacement,
            });
        }
        return aliases;
    }, []);
}

export function readJsonFile(file: string): any {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function getDefaultIgnoreList(): string[] {
    return [
        "**/.ddev/**",
        "**/var/cache/**",
        "**/var/charset/**",
        "**/var/labels/**",
        "**/var/lock/**",
        "**/var/log/**",
        "**/var/session/**",
        "**/var/tests/**",
        "**/var/transient/**",
        "**/fileadmin/**",
        "**/typo3temp/**",
        "**/_processed_/**",
    ];
}

export function getDefaultAllowedOrigins(): RegExp[] {
    return [defaultAllowedOrigins, /^https?:\/\/.*\.ddev\.site(:\d+)?$/];
}
