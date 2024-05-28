import { describe, test, expect } from "vitest";
import { createComposerContext } from "../../src/utils";

describe("createComposerContext", () => {
    test("composer project", () => {
        expect(
            createComposerContext(
                { type: "project" },
                "/path/to/dummy/project",
            ),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
            vendorDir: "vendor",
            webDir: "public",
        });
        expect(
            createComposerContext(
                {
                    type: "project",
                    config: { "vendor-dir": ".Build/vendor" },
                },
                "/path/to/dummy/project",
            ),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
            vendorDir: ".Build/vendor",
            webDir: "public",
        });
        expect(
            createComposerContext(
                {
                    type: "project",
                    extra: { "typo3/cms": { "web-dir": "web" } },
                },
                "/path/to/dummy/project",
            ),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
            vendorDir: "vendor",
            webDir: "web",
        });
    });

    test("typo3 extension", () => {
        expect(
            createComposerContext(
                { type: "typo3-cms-extension" },
                "/path/to/dummy/extension",
            ),
        ).toEqual({
            type: "typo3-cms-extension",
            path: "/path/to/dummy/extension",
            extensionKey: "",
        });
        expect(
            createComposerContext(
                {
                    type: "typo3-cms-extension",
                    extra: {
                        "typo3/cms": { "extension-key": "test_extension" },
                    },
                },
                "/path/to/dummy/extension",
            ),
        ).toEqual({
            type: "typo3-cms-extension",
            path: "/path/to/dummy/extension",
            extensionKey: "test_extension",
        });
    });

    test("composer library", () => {
        expect(
            createComposerContext(
                { type: "library" },
                "/path/to/dummy/library",
            ),
        ).toEqual({
            type: "library",
            path: "/path/to/dummy/library",
        });
        expect(createComposerContext({}, "/path/to/dummy/library")).toEqual({
            type: "library",
            path: "/path/to/dummy/library",
        });
    });
});
