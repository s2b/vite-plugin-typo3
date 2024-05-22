export interface UserConfig {
    target?: VitePluginTarget;
    entrypointFile?: string;
    entrypointIgnorePatterns?: string[];
    debug?: boolean;
}

export interface PluginConfig extends UserConfig {
    target: VitePluginTarget;
    entrypointFile: string;
    composerContext: ComposerContext;
    entrypointIgnorePatterns: string[];
    debug: boolean;
}

export interface Typo3ExtensionInfo {
    key: string;
    path: string;
}

export interface ComposerContext {
    type: string;
    path: string;
    content: any;
}

export type VitePluginTarget = "project" | "typo3-cms-extension";
