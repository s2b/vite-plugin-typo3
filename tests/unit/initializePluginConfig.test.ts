import { describe, test, expect, jest } from "@jest/globals";
import { initializePluginConfig } from "../../src/utils";

jest.mock("node:fs");

describe("initializePluginConfig", () => {
    test("empty user settings", () => {
        expect(
            initializePluginConfig({}, "/path/to/fixtures/composerProject"),
        ).toEqual({
            target: "project",
            entrypointFile: "Configuration/ViteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: false,
            composerContext: {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        });
    });
    test("defined user settings", () => {
        expect(
            initializePluginConfig(
                { debug: true, entrypointFile: "viteEntrypoints.json" },
                "/path/to/fixtures/composerProject",
            ),
        ).toEqual({
            target: "project",
            entrypointFile: "viteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: true,
            composerContext: {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        });
    });
    test("extension target", () => {
        expect(
            initializePluginConfig(
                { target: "extension" },
                "/path/to/fixtures/composerProject/packages/composerExtension/",
            ),
        ).toEqual({
            target: "extension",
            entrypointFile: "Configuration/ViteEntrypoints.json",
            entrypointIgnorePatterns: ["**/node_modules/**", "**/.git/**"],
            debug: false,
            composerContext: {
                type: "typo3-cms-extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension/",
                content: {
                    type: "typo3-cms-extension",
                    extra: {
                        "typo3/cms": {
                            "extension-key": "composer_extension",
                        },
                    },
                },
            },
        });
    });
    test("error if no composer project", () => {
        expect(() => {
            initializePluginConfig({}, "/path/to/fixtures/nonComposerProject");
        }).toThrow();
    });
    test("error if target doesn't match composer project", () => {
        expect(() => {
            initializePluginConfig(
                { target: "extension" },
                "/path/to/fixtures/composerProject",
            );
        }).toThrow();
    });
});
