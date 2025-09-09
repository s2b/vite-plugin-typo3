import { describe, test, expect, vi, beforeEach } from "vitest";
import { collectComposerChain } from "../../src/utils";
import { vol } from "memfs";
import fixtureDirectoryStructure from "./fixtureDirectoryStructure";

vi.mock("node:fs");
vi.mock("node:fs/promises");

beforeEach(() => {
    vol.fromJSON(fixtureDirectoryStructure);
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
                extensionKey: "composer_extension",
            },
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                vendorDir: "vendor",
                webDir: "public",
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
            },
            {
                type: "project",
                path: "/path/to/fixtures/composerProject",
                vendorDir: "vendor",
                webDir: "public",
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
                vendorDir: "vendor",
                webDir: "public",
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
                vendorDir: "vendor",
                webDir: "public",
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
