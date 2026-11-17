import { describe, test, expect, vi, beforeEach } from "vitest";
import { initializePluginConfig } from "../../src/utils";
import { Typo3ExtensionContext, Typo3ProjectContext } from "../../src/types";
import { vol } from "memfs";
import fixtureDirectoryStructure from "./fixtureDirectoryStructure";

vi.mock("node:fs");
vi.mock("node:fs/promises");

beforeEach(() => {
    vol.fromJSON(fixtureDirectoryStructure);
});

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
            devServerStatus: {
                enabled: false,
                envFile: "/path/to/fixtures/composerProject/.env",
                variableName: "VITE_SERVER_RUNNING",
            },
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
            devServerStatus: {
                enabled: false,
                envFile: "/path/to/fixtures/composerProject/.env",
                variableName: "VITE_SERVER_RUNNING",
            },
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
            devServerStatus: {
                enabled: false,
                envFile:
                    "/path/to/fixtures/composerProject/packages/composerExtension/.env",
                variableName: "VITE_SERVER_RUNNING",
            },
            composerContext: {
                type: "typo3-cms-extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension/",
                extensionKey: "composer_extension",
            },
        });
    });
    test("devServerStatus enabled with defaults", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                { devServerStatus: true },
                "/path/to/fixtures/composerProject",
            ).devServerStatus,
        ).toEqual({
            enabled: true,
            envFile: "/path/to/fixtures/composerProject/.env",
            variableName: "VITE_SERVER_RUNNING",
        });
    });
    test("devServerStatus with custom settings", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                {
                    devServerStatus: {
                        envFile: "config/.env.local",
                        variableName: "VITE_DEV",
                    },
                },
                "/path/to/fixtures/composerProject",
            ).devServerStatus,
        ).toEqual({
            enabled: true,
            envFile: "/path/to/fixtures/composerProject/config/.env.local",
            variableName: "VITE_DEV",
        });
    });
    test("devServerStatus with absolute env file", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                { devServerStatus: { envFile: "/somewhere/else/.env" } },
                "/path/to/fixtures/composerProject",
            ).devServerStatus.envFile,
        ).toBe("/somewhere/else/.env");
    });
    test("devServerStatus falls back to defaults for undefined options", () => {
        expect(
            initializePluginConfig<Typo3ProjectContext>(
                {
                    devServerStatus: {
                        envFile: undefined,
                        variableName: undefined,
                    },
                },
                "/path/to/fixtures/composerProject",
            ).devServerStatus,
        ).toEqual({
            enabled: true,
            envFile: "/path/to/fixtures/composerProject/.env",
            variableName: "VITE_SERVER_RUNNING",
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
