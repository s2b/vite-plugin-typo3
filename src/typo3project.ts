import { resolve } from "node:path";
import { type PluginOption, createLogger } from "vite";
import colors from "picocolors";
import type { UserConfig, PluginConfig, Typo3ExtensionInfo } from "./types.js";
import {
    addAliases,
    addRollupInputs,
    determineRelevantTypo3Extensions,
    findEntrypointsInExtensions,
    initializePluginConfig,
    outputDebugInformation,
} from "./utils.js";

export default function typo3project(
    userConfig: UserConfig = {},
): PluginOption {
    const logger = createLogger("info", { prefix: "[plugin-typo3-project]" });

    let pluginConfig: PluginConfig;
    let relevantExtensions: Typo3ExtensionInfo[];
    let entrypoints: string[];

    return {
        name: "vite-plugin-typo3-project",
        config(config) {
            try {
                pluginConfig = initializePluginConfig(userConfig, config.root);
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
            config.build.manifest ??= true;
            config.build.outDir ??= resolve(
                pluginConfig.composerContext.path,
                "public/_assets/vite/",
            );

            // Extract relevant TYPO3 extensions from composer metadata
            relevantExtensions = determineRelevantTypo3Extensions(
                pluginConfig.composerContext,
                pluginConfig.entrypointFile,
            );

            // Add path alias for each extension
            config.resolve ??= {};
            config.resolve.alias = addAliases(
                config.resolve.alias,
                relevantExtensions,
            );

            // Find all vite entrypoints in relevant TYPO3 extensions
            entrypoints = findEntrypointsInExtensions(
                relevantExtensions,
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

            // Add entrypoints to rollup config while preserving entrypoints that were added manually
            config.build.rollupOptions ??= {};
            config.build.rollupOptions.input = addRollupInputs(
                config.build.rollupOptions.input,
                entrypoints,
            );
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
                    pluginConfig.composerContext,
                    logger,
                );
            }
        },
    };
}
