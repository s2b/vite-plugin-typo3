import type { PluginOption } from "vite";
import type { VitePluginTypo3Config, FinalVitePluginTypo3Config, Typo3ExtensionInfo } from "./types.js";
import fg from 'fast-glob';
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import autoOrigin from "vite-plugin-auto-origin";

function hasFile(root: string, file: string): boolean {
    const path = join(root, file);
    return existsSync(path);
}

function isComposerRoot(file: string): boolean {
    const composerJson = readJsonFile(file);
    return composerJson.type === 'project';
}

function determineComposerRoot(current: string, root = current): string {
    if (hasFile(current, 'composer.json') && isComposerRoot(join(current, 'composer.json'))) {
        return current;
    }
    const dir = dirname(current);
    // reach the fs root
    if (!dir || dir === current) {
        return root;
    }
    return determineComposerRoot(dir, root);
}

function readJsonFile(file: string): any {
    return JSON.parse(readFileSync(file, 'utf-8')) || {};
}

function determineRelevantTypo3Extensions(composerRoot: string, pluginConfig: FinalVitePluginTypo3Config): Typo3ExtensionInfo[] {
    const composerPackagePath = join(composerRoot, 'vendor/composer');
    if (!hasFile(composerPackagePath, 'installed.json')) {
        throw new Error(`Unable to read composer package information from "${composerPackagePath}". Try executing "composer install".`)
    }

    const installedPackages = readJsonFile(join(composerPackagePath, 'installed.json'));
    if (!installedPackages.packages) {
        throw new Error(`Invalid composer state in  "${composerPackagePath}/installed.json". Try executing "composer install".`)
    }

    const installedExtensions: Typo3ExtensionInfo[] = installedPackages.packages
        .filter(
            (extension: any) => extension?.type === 'typo3-cms-extension'
        )
        .map((extension: any): Typo3ExtensionInfo => ({
            key: extension['extra']['typo3/cms']['extension-key'],
            path: resolve(composerPackagePath, extension['install-path']),
        }));

    return installedExtensions.filter(
        extension => hasFile(extension.path, pluginConfig.entrypointFile)
    );
}

function findEntrypoints(extensions: Typo3ExtensionInfo[], pluginConfig: FinalVitePluginTypo3Config): string[] {
    let entrypoints: string[] = [];
    extensions.forEach(extension => {
        const entrypointFile = join(extension.path, pluginConfig.entrypointFile);
        const patterns = readJsonFile(entrypointFile).map((pattern: string) => resolve(dirname(entrypointFile), pattern));
        entrypoints = entrypoints.concat(
            fg.sync(patterns, {
                cwd: dirname(entrypointFile),
                ignore: pluginConfig.entrypointIgnorePatterns,
                absolute: true
            })
        );
    });
    return entrypoints;
}

function initializePluginConfig(userConfig: VitePluginTypo3Config, root?: string): FinalVitePluginTypo3Config {
    return {
        entrypointFile: 'Configuration/ViteEntrypoints.json',
        entrypointIgnorePatterns: ['**/node_modules/**', '**/.git/**'],
        composerRoot: determineComposerRoot(root ?? process.cwd()),
        ...userConfig
    };
}

export function typo3Composer(userConfig: VitePluginTypo3Config = {}): PluginOption {
    let pluginConfig: FinalVitePluginTypo3Config;

    // TODO react to changes in ViteEntrypoints.json files

    return {
        name: 'vite-plugin-typo3',
        config(config) {
            pluginConfig = initializePluginConfig(userConfig, config.root);

            // Set empty base path to enable relative paths in generated assets (e. g. CSS files)
            config.base ??= '';

            // Disable public dir since TYPO3 already has plenty of options to serve static files
            config.publicDir ??= false;

            // Setup build destination folder
            config.build ??= {};
            config.build.manifest ??= true;
            config.build.outDir ??= resolve(pluginConfig.composerRoot, 'public/_assets/vite/');

            // Extract relevant TYPO3 extensions from composer metadata
            const relevantExtensions = determineRelevantTypo3Extensions(pluginConfig.composerRoot, pluginConfig);

            // Add path alias for each extension
            config.resolve ??= {};
            config.resolve.alias ??= {};
            const aliases = relevantExtensions.map(extension => ({
                find: '@' + extension.key,
                replacement: extension.path,
            }));
            config.resolve.alias = {...config.resolve.alias, ...aliases};

            // Find all vite entrypoints in relevant TYPO3 extensions
            const entrypoints = findEntrypoints(relevantExtensions, pluginConfig);

            // Add entrypoints to rollup config while preserving entrypoints that were added manually
            config.build.rollupOptions ??= {};
            config.build.rollupOptions.input ??= [];
            if (typeof config.build.rollupOptions.input === 'string') {
                config.build.rollupOptions.input = [config.build.rollupOptions.input];
            }
            config.build.rollupOptions.input = Object.values(config.build.rollupOptions.input).concat(entrypoints);

            console.log('viteConfig', config)

            console.log(this)
        }
    };
}

export default function typo3(userConfig: VitePluginTypo3Config) {
    return [ typo3Composer(userConfig), autoOrigin() ];
}
