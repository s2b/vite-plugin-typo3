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
                    content: {},
                },
                "Configuration/ViteEntrypoints.json",
            ),
        ).toEqual([
            {
                key: "composer_extension",
                path: "/path/to/fixtures/composerProject/packages/composerExtension",
            },
            {
                key: "namespace_extension",
                path: "/path/to/fixtures/composerProject/vendor/namespace/extension",
            },
        ]);
    });

    test("wrong composer type", () => {
        expect(() => {
            determineRelevantTypo3Extensions(
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension",
                    content: {},
                },
                "Configuration/ViteEntrypoints.json",
            );
        }).toThrow();
    });

    test("no vendor path", () => {
        expect(() => {
            determineRelevantTypo3Extensions(
                {
                    type: "project",
                    path: "/path/to/fixtures/composerProjectWIthoutVendor",
                    content: {},
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
                    content: {},
                },
                "Configuration/ViteEntrypoints.json",
            );
        }).toThrow();
    });
});
