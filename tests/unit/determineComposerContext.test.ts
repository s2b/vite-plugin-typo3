import { describe, test, expect } from "@jest/globals";
import { determineComposerContext } from "../../src/utils";

describe("determineComposerContext", () => {
    test("user-defined target with existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toEqual({
            type: "project",
            path: "/path/to/dummy/project",
            content: { type: "project" },
        });
        expect(
            determineComposerContext("extension", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toEqual({
            type: "typo3-cms-extension",
            path: "/path/to/dummy/extension1",
            content: { type: "typo3-cms-extension" },
        });
    });
    test("user-defined target with non-existing composer.json", () => {
        expect(
            determineComposerContext("project", [
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension1",
                    content: { type: "typo3-cms-extension" },
                },
                {
                    type: "typo3-cms-extension",
                    path: "/path/to/dummy/extension2",
                    content: { type: "typo3-cms-extension" },
                },
            ]),
        ).toBeUndefined();
        expect(
            determineComposerContext("extension", [
                {
                    type: "project",
                    path: "/path/to/dummy/project",
                    content: { type: "project" },
                },
            ]),
        ).toBeUndefined();
    });
    test("without composer.json files", () => {
        expect(determineComposerContext("extension", [])).toBeUndefined();
        expect(determineComposerContext("project", [])).toBeUndefined();
    });
});
