import { describe, test, expect, vi, beforeEach } from "vitest";
import { determineAvailableTypo3Extensions } from "../../src/utils";
import { vol } from "memfs";
import fixtureDirectoryStructure from "./fixtureDirectoryStructure";

vi.mock("node:fs");
vi.mock("node:fs/promises");

beforeEach(() => {
    vol.fromJSON(fixtureDirectoryStructure);
});

describe("determineAvailableTypo3Extensions", () => {
    test("determineAvailableTypo3Extensions", () => {
        expect(
            determineAvailableTypo3Extensions({
                type: "project",
                path: "/path/to/fixtures/composerProject",
                vendorDir: "vendor",
                webDir: "public",
            }),
        ).toEqual([
            {
                type: "typo3-cms-extension",
                extensionKey: "composer_extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension",
            },
            {
                type: "typo3-cms-extension",
                extensionKey: "namespace_extension",
                path: "/path/to/fixtures/composerProject/vendor/namespace/extension",
            },
        ]);
    });

    test("no vendor path", () => {
        expect(() => {
            determineAvailableTypo3Extensions({
                type: "project",
                path: "/path/to/fixtures/composerProjectWIthoutVendor",
                vendorDir: "vendor",
                webDir: "public",
            });
        }).toThrow();
    });

    test("invalid installed.json", () => {
        expect(() => {
            determineAvailableTypo3Extensions({
                type: "project",
                path: "/path/to/fixtures/composerProjectInvalidVendor",
                vendorDir: "vendor",
                webDir: "public",
            });
        }).toThrow();
    });
});
