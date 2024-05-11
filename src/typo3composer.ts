import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { PluginOption } from "vite";
import fg from "fast-glob";
import type {
    VitePluginTypo3Config,
    FinalVitePluginTypo3Config,
    Typo3ExtensionInfo,
} from "./types.js";
import { initializePluginConfig, readJsonFile } from "./utils.js";

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

export default function typo3composer(
    userConfig: VitePluginTypo3Config = {},
): PluginOption {
    let pluginConfig: FinalVitePluginTypo3Config;

    // TODO react to changes in ViteEntrypoints.json files
    // TODO validate configuration and show notices/warnings (e. g. if manifest is disabled)
    // TODO cover more edge cases with proper error messages to simplify debugging
    // TODO add variant for libraries/extensions
    // TODO show "start message" with extensions, aliases and discovered endpoints

    return {
        name: "vite-plugin-typo3",
        config(config) {
            pluginConfig = initializePluginConfig(userConfig, config.root);

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
            const relevantExtensions = determineRelevantTypo3Extensions(
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
            const entrypoints = findEntrypoints(
                relevantExtensions,
                pluginConfig,
            );

            // Add entrypoints to rollup config while preserving entrypoints that were added manually
            config.build.rollupOptions ??= {};
            config.build.rollupOptions.input ??= [];
            if (typeof config.build.rollupOptions.input === "string") {
                config.build.rollupOptions.input = [
                    config.build.rollupOptions.input,
                ];
            }
            config.build.rollupOptions.input = Object.values(
                config.build.rollupOptions.input,
            ).concat(entrypoints);

            console.log("viteConfig", config);

            console.log(this);
        },
    };
}
