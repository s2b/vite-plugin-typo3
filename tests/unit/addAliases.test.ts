import { describe, test, expect } from "vitest";
import { addAliases } from "../../src/utils";

describe("addAliases", () => {
    test("no existing aliases", () => {
        expect(addAliases(undefined, [])).toEqual([]);
        expect(
            addAliases(undefined, [
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension",
                    path: "/path/to/dummy/extension1",
                },
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
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension",
                    path: "/path/to/dummy/extension1",
                },
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
                [
                    {
                        type: "typo3-cms-extension",
                        extensionKey: "test_extension",
                        path: "/path/to/dummy/extension1",
                    },
                ],
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
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension",
                    path: "/path/to/dummy/extension1/",
                },
            ]),
        ).toEqual([
            {
                find: "@test_extension",
                replacement: "/path/to/dummy/extension1/",
            },
        ]);
    });
});
