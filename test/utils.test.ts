import { describe, expect, test } from "@jest/globals";
import { isComposerRoot } from "../src/utils";
import { resolve } from "node:path";

describe("utils module", () => {
    test("checks projectComposerFile.json to be valid root composer file", () => {
        expect(
            isComposerRoot(
                resolve(__dirname, "fixtures/projectComposerFile.json"),
            ),
        ).toBe(true);
    });
    test("checks extensionComposerFile.json to be invalid root composer file", () => {
        expect(
            isComposerRoot(
                resolve(__dirname, "fixtures/extensionComposerFile.json"),
            ),
        ).toBe(false);
    });
    test("checks libraryComposerFile.json to be invalid root composer file", () => {
        expect(
            isComposerRoot(
                resolve(__dirname, "fixtures/libraryComposerFile.json"),
            ),
        ).toBe(false);
    });
});
