export interface UserConfig {
    target?: PluginTarget;
    entrypointFile?: string;
    entrypointIgnorePatterns?: string[];
    debug?: boolean;
}

export interface PluginConfig<T extends ComposerContext> extends UserConfig {
    target: PluginTarget;
    entrypointFile: string;
    composerContext: T;
    entrypointIgnorePatterns: string[];
    debug: boolean;
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
