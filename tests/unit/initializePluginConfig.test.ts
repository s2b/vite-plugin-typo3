import { describe, test, expect, vi } from "vitest";
import { initializePluginConfig } from "../../src/utils";
import { Typo3ExtensionContext, Typo3ProjectContext } from "../../src/types";

vi.mock("node:fs");

describe("initializePluginConfig", () => {
    test("empty user settings", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                {},
                "/path/to/fixtures/composerProject",
            ),
        ).toEqual({
            target: "project",
            entrypointFile: "Configuration/ViteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: false,
            aliases: true,
            composerContext: {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                vendorDir: "vendor",
                webDir: "public",
            },
        });
    });
    test("defined user settings", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                { debug: true, entrypointFile: "viteEntrypoints.json" },
                "/path/to/fixtures/composerProject",
            ),
        ).toEqual({
            target: "project",
            entrypointFile: "viteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: true,
            aliases: true,
            composerContext: {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                vendorDir: "vendor",
                webDir: "public",
            },
        });
    });
    test("extension target", () => {
        expect(
            initializePluginConfig<Typo3ExtensionContext>(
                { target: "extension" },
                "/path/to/fixtures/composerProject/packages/composerExtension/",
            ),
        ).toEqual({
            target: "extension",
            entrypointFile: "Configuration/ViteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: false,
            aliases: true,
            composerContext: {
                type: "typo3-cms-extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension/",
                extensionKey: "composer_extension",
            },
        });
    });
    test("error if no composer project", () => {
        expect(() => {
            initializePluginConfig<Typo3ProjectContext>(
                {},
                "/path/to/fixtures/nonComposerProject",
            );
        }).toThrow();
    });
    test("error if target doesn't match composer project", () => {
        expect(() => {
            initializePluginConfig<Typo3ExtensionContext>(
                { target: "extension" },
                "/path/to/fixtures/composerProject",
            );
        }).toThrow();
    });
});
