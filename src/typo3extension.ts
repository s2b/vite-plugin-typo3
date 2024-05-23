import { LibraryOptions, PluginOption, createLogger } from "vite";
import {
    ComposerContext,
    PluginConfig,
    Typo3ExtensionInfo,
    UserConfig,
} from "./types.js";
import {
    addAliases,
    addRollupInputs,
    findEntrypointsInExtensions,
    initializePluginConfig,
    outputDebugInformation,
} from "./utils.js";
import { resolve } from "node:path";
import colors from "picocolors";

function determineExtensionKey(composerContext: ComposerContext): string {
    return composerContext.content["extra"]["typo3/cms"]["extension-key"] ?? "";
}

export default function typo3extension(
    userConfig: UserConfig = {},
): PluginOption {
    const logger = createLogger("info", { prefix: "[plugin-typo3-extension]" });

    let pluginConfig: PluginConfig;
    let extension: Typo3ExtensionInfo;
    let entrypoints: string[];

    return {
        name: "vite-plugin-typo3-extension",
        apply: "build",
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
            config.build.outDir ??= resolve(
                pluginConfig.composerContext.path,
                "Resources/Public/Vite/",
            );

            extension = {
                key: determineExtensionKey(pluginConfig.composerContext),
                path: pluginConfig.composerContext.path,
            };

            // Add path alias for extension
            config.resolve ??= {};
            addAliases(config.resolve.alias, [extension]);

            // Find all vite entrypoints in extension
            entrypoints = findEntrypointsInExtensions(
                [extension],
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

            // Setup build destination folder
            const lib: LibraryOptions | undefined =
                config.build.lib !== false ? config.build.lib : undefined;
            config.build.lib = {
                ...lib,
                entry: addRollupInputs(lib?.entry, entrypoints),
            };
        },
        configResolved() {
            if (pluginConfig.debug) {
                outputDebugInformation(
                    [extension],
                    entrypoints,
                    pluginConfig,
                    logger,
                );
            }
        },
    };
}
