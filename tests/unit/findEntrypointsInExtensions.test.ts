import { describe, expect, test } from "vitest";
import { findEntrypointsInExtensions } from "../../src/utils";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Tests use the actual filesystem because of an issue in fast-glob
// vi.mock("node:fs");

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("findEntrypointsInExtensions", () => {
    test("extension with one entrypoint", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(
                            __dirname,
                            "fixtures/extensionWithOneEntrypoint",
                        ),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                [],
            ),
        ).toEqual([
            join(
                __dirname,
                "fixtures/extensionWithOneEntrypoint/Resources/Private/Main.entry.js",
            ),
        ]);
    });

    test("extension with glob", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(__dirname, "fixtures/extensionWithGlob"),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                [],
            ),
        ).toEqual([
            join(
                __dirname,
                "fixtures/extensionWithGlob/Resources/Private/Alt.entry.js",
            ),
            join(
                __dirname,
                "fixtures/extensionWithGlob/Resources/Private/Main.entry.js",
            ),
        ]);
    });

    test("extension with non-matching glob", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(
                            __dirname,
                            "fixtures/extensionWithNonmatchingGlob",
                        ),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                [],
            ),
        ).toEqual([]);
    });

    test("extension with empty entrypoints", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(
                            __dirname,
                            "fixtures/extensionWithEmptyEntrypoints",
                        ),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                [],
            ),
        ).toEqual([]);
    });

    test("extension without entrypoints", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(
                            __dirname,
                            "fixtures/extensionWithoutEntrypoints",
                        ),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                [],
            ),
        ).toEqual([]);
    });

    test("different entrypoint file name", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(
                            __dirname,
                            "fixtures/extensionWithDifferentFilename",
                        ),
                    },
                ],
                "entrypoints.json",
                [],
            ),
        ).toEqual([
            join(
                __dirname,
                "fixtures/extensionWithDifferentFilename/Resources/Private/Main.entry.js",
            ),
        ]);
    });

    test("ignored file", () => {
        expect(
            findEntrypointsInExtensions(
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: join(__dirname, "fixtures/extensionWithGlob"),
                    },
                ],
                "Configuration/ViteEntrypoints.json",
                ["**/Main.entry.js"],
            ),
        ).toEqual([
            join(
                __dirname,
                "fixtures/extensionWithGlob/Resources/Private/Alt.entry.js",
            ),
        ]);
    });
});
