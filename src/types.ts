export interface UserConfig {
    target?: PluginTarget;
    entrypointFile?: string;
    entrypointIgnorePatterns?: string[];
    composerPackagePaths?: string[];
    debug?: boolean;
    aliases?: AliasConfig;
}

export interface PluginConfig<T extends ComposerContext> extends UserConfig {
    target: PluginTarget;
    entrypointFile: string;
    composerContext: T;
    composerPackagePaths?: string[];
    entrypointIgnorePatterns: string[];
    debug: boolean;
    aliases: AliasConfig;
}

export interface ComposerContext {
    type: string;
    path: string;
    extensionKey?: string;
    vendorDir?: string;
    webDir?: string;
}

export interface Typo3ExtensionContext extends ComposerContext {
    type: "typo3-cms-extension";
    extensionKey: string;
}

export interface Typo3ProjectContext extends ComposerContext {
    type: "project";
    vendorDir: string;
    webDir: string;
}

export type PluginTarget = "project" | "extension";

export type AliasConfig = true | "EXT" | "@" | false;
