import { join } from "node:path";
import { type LibraryOptions, type PluginOption, createLogger } from "vite";
import colors from "picocolors";
import type {
    PluginConfig,
    Typo3ExtensionContext,
    UserConfig,
} from "./types.js";
import {
    addAliases,
    addRollupInputs,
    findEntrypointsInExtensions,
    getDefaultIgnoreList,
    initializePluginConfig,
    outputDebugInformation,
} from "./utils.js";

export default function typo3extension(
    userConfig: UserConfig = {},
): PluginOption {
    const logger = createLogger("info", { prefix: "[plugin-typo3-extension]" });

    let pluginConfig: PluginConfig<Typo3ExtensionContext>;
    let extension: Typo3ExtensionContext;
    let entrypoints: string[];

    return {
        name: "vite-plugin-typo3-extension",
        apply: "build",
        config(config) {
            // Don't watch files in irrelevant/temporary TYPO3 directories
            // This prevents performance issues and avoids file system problems
            config.server ??= {};
            config.server.watch ??= {};
            config.server.watch.ignored ??= getDefaultIgnoreList();

            try {
                pluginConfig = initializePluginConfig({
                    userConfig,
                    root: config.root ?? process.cwd(),
                });
            } catch (err: any) {
                logger.error(colors.red(err.mesage), { timestamp: true });
                return;
            }

            // Set empty base path to enable relative paths in generated assets (e. g. CSS files)
            config.base ??= "";

            // Disable public dir since TYPO3 already has plenty of options to serve static files
            config.publicDir ??= false;

            // Enable source maps for CSS files in dev environment
            config.css ??= {};
            config.css.devSourcemap ??= true;

            // Setup build destination folder
            config.build ??= {};
            config.build.outDir ??= join(
                pluginConfig.composerContext.path,
                "Resources/Public/Vite/",
            );

            extension = pluginConfig.composerContext as Typo3ExtensionContext;

            // Add path alias for extension
            config.resolve ??= {};
            config.resolve.alias = addAliases(
                config.resolve.alias,
                [extension],
                pluginConfig.aliases,
            );

            // Find all vite entrypoints in extension
            entrypoints = findEntrypointsInExtensions(
                [extension],
                pluginConfig.entrypointFile,
                pluginConfig.entrypointIgnorePatterns,
            );

            if (!entrypoints.length) {
                logger.warn(
                    colors.red(
                        "No entrypoints from TYPO3 extensions have been picked up. Make sure that you create at least one 'Configuration/ViteEntrypoints.json' file.",
                    ),
                    { timestamp: true },
                );
            }

            // Setup build destination folder
            const lib: LibraryOptions | undefined =
                config.build.lib !== false ? config.build.lib : undefined;
            config.build.lib = {
                formats: ["es", "cjs"],
                ...lib,
                entry: addRollupInputs(lib?.entry, entrypoints),
            };
        },
        configResolved() {
            if (pluginConfig && pluginConfig.debug) {
                outputDebugInformation({
                    availableExtensions: [extension],
                    entrypoints,
                    composerContext: pluginConfig.composerContext,
                    logger,
                    aliasConfig: pluginConfig.aliases,
                });
            }
        },
    };
}
