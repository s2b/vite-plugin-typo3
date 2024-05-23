export interface UserConfig {
    target?: PluginTarget;
    entrypointFile?: string;
    entrypointIgnorePatterns?: string[];
    debug?: boolean;
}

export interface PluginConfig extends UserConfig {
    target: PluginTarget;
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

export type PluginTarget = "project" | "extension";
