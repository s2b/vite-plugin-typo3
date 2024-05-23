import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import {
    collectComposerChain,
    determineComposerContext,
    readJsonFile,
} from "../src/utils";
import { resolve } from "node:path";
import mockFs from "mock-fs";

beforeAll(() => {
    // TODO switch to memfs to be compatible with node >= 20
    mockFs({
        "/path/to/fixtures": mockFs.load(resolve(__dirname, "fixtures")),
    });
});
afterAll(() => {
    mockFs.restore();
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

describe("readJsonFile", () => {
    test("reads composer.json as json", () => {
        expect(
            readJsonFile(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toEqual({ type: "library" });
    });
});
