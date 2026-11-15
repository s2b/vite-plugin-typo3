export interface UserConfig {
    target?: PluginTarget;
    entrypointFile?: string;
    entrypointIgnorePatterns?: string[];
    debug?: boolean;
    aliases?: AliasConfig;
    devServerStatus?: DevServerStatusUserConfig | boolean;
}

export interface PluginConfig<T extends ComposerContext> extends UserConfig {
    target: PluginTarget;
    entrypointFile: string;
    composerContext: T;
    entrypointIgnorePatterns: string[];
    debug: boolean;
    aliases: AliasConfig;
    devServerStatus: DevServerStatusConfig;
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

export interface DevServerStatusUserConfig {
    variableName?: string;
    envFile?: string;
}

export interface DevServerStatusConfig extends Required<DevServerStatusUserConfig> {
    enabled: boolean;
}

export type PluginTarget = "project" | "extension";

export type AliasConfig = true | "EXT" | "@" | false;
