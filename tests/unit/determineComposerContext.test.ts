import { describe, test, expect } from "vitest";
import { determineComposerContext } from "../../src/utils";

describe("determineComposerContext", () => {
    test("user-defined target with existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                },
            ]),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
        });
        expect(
            determineComposerContext("extension", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                },
            ]),
        ).toEqual({
            type: "typo3-cms-extension",
            path: "/path/to/dummy/extension1",
        });
    });
    test("user-defined target with non-existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                },
            ]),
        ).toBeUndefined();
        expect(
            determineComposerContext("extension", [
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                },
            ]),
        ).toBeUndefined();
    });
    test("without composer.json files", () => {
        expect(determineComposerContext("extension", [])).toBeUndefined();
        expect(determineComposerContext("project", [])).toBeUndefined();
    });
});
