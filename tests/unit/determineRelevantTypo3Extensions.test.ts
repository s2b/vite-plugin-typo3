import { describe, test, expect, jest } from "@jest/globals";
import { determineRelevantTypo3Extensions } from "../../src/utils";

jest.mock("node:fs");

describe("determineRelevantTypo3Extensions", () => {
    test("determineRelevantTypo3Extensions", () => {
        expect(
            determineRelevantTypo3Extensions(
                {
                    type: "project",
                    path: "/path/to/fixtures/composerProject",
                    vendorDir: "vendor",
                    webDir: "public",
                },
                "Configuration/ViteEntrypoints.json",
            ),
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
            determineRelevantTypo3Extensions(
                {
                    type: "project",
                    path: "/path/to/fixtures/composerProjectWIthoutVendor",
                    vendorDir: "vendor",
                    webDir: "public",
                },
                "Configuration/ViteEntrypoints.json",
            );
        }).toThrow();
    });

    test("invalid installed.json", () => {
        expect(() => {
            determineRelevantTypo3Extensions(
                {
                    type: "project",
                    path: "/path/to/fixtures/composerProjectInvalidVendor",
                    vendorDir: "vendor",
                    webDir: "public",
                },
                "Configuration/ViteEntrypoints.json",
            );
        }).toThrow();
    });
});
