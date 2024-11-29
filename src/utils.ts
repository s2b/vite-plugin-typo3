import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { InputOption } from "rollup";
import type { Alias, AliasOptions, Logger } from "vite";
import fg from "fast-glob";
import colors from "picocolors";
import type {
    ComposerContext,
    PluginConfig,
    PluginTarget,
    UserConfig,
    Typo3ProjectContext,
    Typo3ExtensionContext,
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
            fg.globSync(patterns, {
                cwd: dirname(file),
                ignore: entrypointIgnorePatterns,
                absolute: true,
                // This doesn't seem to work correctly, which is why tests
                // use the actual file system for now
                // fs,
            }),
        );
    });
    return entrypoints;
}

export function determineRelevantTypo3Extensions(
    composerContext: Typo3ProjectContext,
    entrypointFile: string,
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

    return installedExtensions.filter((extension) =>
        fs.existsSync(join(extension.path, entrypointFile)),
    );
}

export function outputDebugInformation(
    relevantExtensions: Typo3ExtensionContext[],
    entrypoints: string[],
    composerContext: ComposerContext,
    logger: Logger,
): void {
    if (relevantExtensions.length) {
        const extensionList = relevantExtensions.map(
            (extension) => extension.extensionKey,
        );
        const aliasList = extensionList.reduce(
            (aliasList: string[], extensionKey) =>
                aliasList.concat(["@" + extensionKey, "EXT:" + extensionKey]),
            [],
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
): AliasOptions {
    const additionalAliases = extensions.reduce(
        (aliases: Alias[], extension) => {
            const replacement = extension.path.endsWith("/")
                ? extension.path
                : extension.path + "/";
            aliases.push({ find: "@" + extension.extensionKey, replacement });
            aliases.push({
                find: "EXT:" + extension.extensionKey,
                replacement,
            });
            return aliases;
        },
        [],
    );

    alias ??= [];
    if (!Array.isArray(alias)) {
        alias = Object.entries(alias).map((entry) => ({
            find: entry[0],
            replacement: entry[1],
        }));
    }

    return alias.concat(additionalAliases);
}

export function readJsonFile(file: string): any {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
}
