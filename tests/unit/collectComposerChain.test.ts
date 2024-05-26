import { describe, test, expect, jest } from "@jest/globals";
import { collectComposerChain } from "../../src/utils";

jest.mock("node:fs");

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
                content: {
                    type: "typo3-cms-extension",
                    extra: {
                        "typo3/cms": {
                            "extension-key": "composer_extension",
                        },
                    },
                },
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
