import { describe, expect, test, jest } from "@jest/globals";
import {
    addAliases,
    addRollupInputs,
    collectComposerChain,
    determineComposerContext,
    initializePluginConfig,
    readJsonFile,
} from "../src/utils";

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
                content: { type: "typo3-cms-extension" },
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

describe("determineComposerContext", () => {
    test("user-defined target with existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
            content: { type: "project" },
        });
        expect(
            determineComposerContext("extension", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toEqual({
            type: "typo3-cms-extension",
            path: "/path/to/dummy/extension1",
            content: { type: "typo3-cms-extension" },
        });
    });
    test("user-defined target with non-existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
            ]),
        ).toBeUndefined();
        expect(
            determineComposerContext("extension", [
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toBeUndefined();
    });
    test("without composer.json files", () => {
        expect(determineComposerContext("extension", [])).toBeUndefined();
        expect(determineComposerContext("project", [])).toBeUndefined();
    });
});

describe("collectComposerChain", () => {
    test("determines composer chain from extension path", () => {
        expect(
            collectComposerChain(
                "/path/to/fixtures/composerProject/packages/composerExtension",
            ),
        ).toEqual([
            {
                type: "typo3-cms-extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension",
                content: { type: "typo3-cms-extension" },
            },
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        ]);
    });
    test("determines composer chain from library path", () => {
        expect(
            collectComposerChain(
                "/path/to/fixtures/composerProject/vendor/namespace/library",
            ),
        ).toEqual([
            {
                type: "library",
                path: "/path/to/fixtures/composerProject/vendor/namespace/library",
                content: { type: "library" },
            },
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        ]);
    });
    test("determines composer chain from root path", () => {
        expect(
            collectComposerChain("/path/to/fixtures/composerProject"),
        ).toEqual([
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        ]);
    });
    test("determines composer chain from other path", () => {
        expect(
            collectComposerChain("/path/to/fixtures/composerProject/packages"),
        ).toEqual([
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                content: { type: "project" },
            },
        ]);
    });

    test("fail to determine composer chain from extension path", () => {
        expect(
            collectComposerChain(
                "/path/to/fixtures/nonComposerProject/typo3conf/ext/non_composer_extension",
            ),
        ).toEqual([]);
    });
});

describe("addRollupInputs", () => {
    test("existing string input", () => {
        expect(addRollupInputs("path/to/input.js", [])).toEqual([
            "path/to/input.js",
        ]);
        expect(
            addRollupInputs("path/to/input.js", [
                "path/to/additional/input.js",
            ]),
        ).toEqual(["path/to/input.js", "path/to/additional/input.js"]);
    });
    test("existing array input", () => {
        expect(
            addRollupInputs(
                ["path/to/input1.js", "path/to/input2.js"],
                ["path/to/additional/input.js"],
            ),
        ).toEqual([
            "path/to/input1.js",
            "path/to/input2.js",
            "path/to/additional/input.js",
        ]);
    });
    test("existing object input", () => {
        expect(
            addRollupInputs(
                { input1: "path/to/input1.js", input2: "path/to/input2.js" },
                ["path/to/additional/input.js"],
            ),
        ).toEqual({
            input1: "path/to/input1.js",
            input2: "path/to/input2.js",
            "0": "path/to/additional/input.js",
        });
    });
});

describe("addAliases", () => {
    test("no existing aliases", () => {
        expect(addAliases(undefined, [])).toEqual([]);
        expect(
            addAliases(undefined, [
                { key: "test_extension", path: "/path/to/dummy/extension1" },
            ]),
        ).toEqual([
            {
                find: "@test_extension",
                replacement: "/path/to/dummy/extension1/",
            },
        ]);
    });
    test("existing aliases as object", () => {
        expect(
            addAliases({ "@existing_find": "/path/to/replace/with/" }, []),
        ).toEqual([
            { find: "@existing_find", replacement: "/path/to/replace/with/" },
        ]);
        expect(
            addAliases({ "@existing_find": "/path/to/replace/with/" }, [
                { key: "test_extension", path: "/path/to/dummy/extension1" },
            ]),
        ).toEqual([
            { find: "@existing_find", replacement: "/path/to/replace/with/" },
            {
                find: "@test_extension",
                replacement: "/path/to/dummy/extension1/",
            },
        ]);
    });
    test("existing aliases as array", () => {
        expect(
            addAliases(
                [
                    {
                        find: "@existing_find",
                        replacement: "/path/to/replace/with/",
                    },
                ],
                [],
            ),
        ).toEqual([
            {
                find: "@existing_find",
                replacement: "/path/to/replace/with/",
            },
        ]);
        expect(
            addAliases(
                [
                    {
                        find: "@existing_find",
                        replacement: "/path/to/replace/with/",
                    },
                ],
                [{ key: "test_extension", path: "/path/to/dummy/extension1" }],
            ),
        ).toEqual([
            { find: "@existing_find", replacement: "/path/to/replace/with/" },
            {
                find: "@test_extension",
                replacement: "/path/to/dummy/extension1/",
            },
        ]);
    });
    test("no double slashes in added alias paths", () => {
        expect(
            addAliases(undefined, [
                { key: "test_extension", path: "/path/to/dummy/extension1/" },
            ]),
        ).toEqual([
            {
                find: "@test_extension",
                replacement: "/path/to/dummy/extension1/",
            },
        ]);
    });
});

describe("readJsonFile", () => {
    test("reads composer.json as json", () => {
        expect(
            readJsonFile(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toEqual({ type: "library" });
    });
});
