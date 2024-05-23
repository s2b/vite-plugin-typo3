import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { PluginOption } from "vite";
import colors from "picocolors";
import type { UserConfig, PluginConfig, Typo3ExtensionInfo } from "./types.js";
import {
    addAliases,
    addRollupInputs,
    findEntrypointsInExtensions,
    initializePluginConfig,
    outputDebugInformation,
    readJsonFile,
} from "./utils.js";
import { createLogger } from "vite";

function determineRelevantTypo3Extensions(
    pluginConfig: PluginConfig,
): Typo3ExtensionInfo[] {
    const vendorDir =
        pluginConfig.composerContext.content?.config?.["vendor-dir"] ??
        "vendor";
    const composerInstalled = join(
        pluginConfig.composerContext.path,
        vendorDir,
        "composer/installed.json",
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
            relevantExtensions = determineRelevantTypo3Extensions(pluginConfig);

            // Add path alias for each extension
            config.resolve ??= {};
            config.resolve.alias = addAliases(
                config.resolve.alias,
                relevantExtensions,
            );

            // Find all vite entrypoints in relevant TYPO3 extensions
            entrypoints = findEntrypointsInExtensions(
                relevantExtensions,
                pluginConfig,
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
                    pluginConfig,
                    logger,
                );
            }
        },
    };
}
