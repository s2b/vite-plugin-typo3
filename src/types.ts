export interface VitePluginTypo3Config {
    entrypointFile?: string;
    composerRoot?: string;
    entrypointIgnorePatterns?: string[];
    debug?: boolean;
}

export interface FinalVitePluginTypo3Config extends VitePluginTypo3Config {
    entrypointFile: string;
    composerRoot: string;
    entrypointIgnorePatterns: string[];
    debug: boolean;
}

export interface Typo3ExtensionInfo {
    key: string;
    path: string;
}
