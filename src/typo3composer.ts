import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Alias, Logger, PluginOption } from "vite";
import type { InputOptions } from "rollup";
import fg from "fast-glob";
import colors from "picocolors";
import type {
    VitePluginTypo3Config,
    FinalVitePluginTypo3Config,
    Typo3ExtensionInfo,
} from "./types.js";
import { initializePluginConfig, readJsonFile } from "./utils.js";
import { createLogger } from "vite";

function determineRelevantTypo3Extensions(
    composerRoot: string,
    pluginConfig: FinalVitePluginTypo3Config,
): Typo3ExtensionInfo[] {
    const composerInstalled = join(
        composerRoot,
        "vendor/composer/installed.json",
    );
    if (!existsSync(composerInstalled)) {
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

    const installedExtensions: Typo3ExtensionInfo[] = installedPackages.packages
        .filter((extension: any) => extension?.type === "typo3-cms-extension")
        .map(
            (extension: any): Typo3ExtensionInfo => ({
                key: extension["extra"]["typo3/cms"]["extension-key"],
                path: resolve(
                    dirname(composerInstalled),
                    extension["install-path"],
                ),
            }),
        );

    return installedExtensions.filter((extension) =>
        existsSync(join(extension.path, pluginConfig.entrypointFile)),
    );
}

function findEntrypoints(
    extensions: Typo3ExtensionInfo[],
    pluginConfig: FinalVitePluginTypo3Config,
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

function outputDebugInformation(
    relevantExtensions: Typo3ExtensionInfo[],
    entrypoints: string[],
    pluginConfig: VitePluginTypo3Config,
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
            path.replace(pluginConfig.composerRoot + "/", ""),
        );
        logger.info(
            `The following entrypoints will be served:\n` +
                colors.green("➜ " + entrypointList.join("\n➜ ")),
            { timestamp: true },
        );
    }
}

function addRollupInputs(options: InputOptions, inputs: string[]): InputOptions
{
    // Prevent empty input, which would trigger index.html fallback by vite
    options.input ??= [];
    if (typeof options.input === "string") {
        options.input = [options.input].concat(inputs);
    } else if (Array.isArray(options.input)) {
        options.input = options.input.concat(inputs);
    } else {
        options.input = { ...options.input, ...inputs }
    }
    return options;
}

export default function typo3composer(
    userConfig: VitePluginTypo3Config = {},
): PluginOption {
    const logger = createLogger("info", { prefix: "[plugin-typo3]" });

    let pluginConfig: FinalVitePluginTypo3Config;
    let relevantExtensions: Typo3ExtensionInfo[];
    let entrypoints: string[];

    // TODO cover more edge cases with proper error messages to simplify debugging
    // TODO add variant for libraries/extensions
    // TODO allow different vendor dir (config.vendor-dir)

    return {
        name: "vite-plugin-typo3",
        config(config) {
            pluginConfig = initializePluginConfig(userConfig, config.root);

            // TODO differentiate composer setups, show warning if invalid

            // Set empty base path to enable relative paths in generated assets (e. g. CSS files)
            config.base ??= "";

            // Disable public dir since TYPO3 already has plenty of options to serve static files
            config.publicDir ??= false;

            // Enable source maps for CSS files in dev environment
            config.css ??= {};
            config.css.devSourcemap ??= true;

            // Setup build destination folder
            config.build ??= {};
            config.build.manifest ??= true;
            config.build.outDir ??= resolve(
                pluginConfig.composerRoot,
                "public/_assets/vite/",
            );

            // Extract relevant TYPO3 extensions from composer metadata
            relevantExtensions = determineRelevantTypo3Extensions(
                pluginConfig.composerRoot,
                pluginConfig,
            );

            // Add path alias for each extension
            config.resolve ??= {};
            config.resolve.alias ??= {};
            const aliases = relevantExtensions.map((extension) => ({
                find: "@" + extension.key,
                replacement: extension.path,
            }));
            config.resolve.alias = { ...config.resolve.alias, ...aliases };

            // Find all vite entrypoints in relevant TYPO3 extensions
            entrypoints = findEntrypoints(relevantExtensions, pluginConfig);

            if (!entrypoints.length) {
                logger.warn(
                    colors.red(
                        "No entrypoints from TYPO3 extensions have been picked up. Make sure that you create at least one 'Configuration/ViteEntrypoints.json' file.",
                    ),
                    { timestamp: true },
                );
            }

            // Add entrypoints to rollup config while preserving entrypoints that were added manually
            config.build.rollupOptions = addRollupInputs(config.build.rollupOptions ?? {}, entrypoints);
        },
        configResolved(config) {
            if (config.build.manifest === false) {
                logger.warn(
                    colors.red(
                        "'config.build.manifest' is set to 'false', which might lead to problems with TYPO3.",
                    ),
                    { timestamp: true },
                );
            }

            if (pluginConfig.debug) {
                outputDebugInformation(
                    relevantExtensions,
                    entrypoints,
                    pluginConfig,
                    logger,
                );
            }
        },
    };
}
