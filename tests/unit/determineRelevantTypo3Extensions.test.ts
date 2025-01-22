import { describe, test, expect, vi } from "vitest";
import { determineAvailableTypo3Extensions } from "../../src/utils";

vi.mock("node:fs");

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
