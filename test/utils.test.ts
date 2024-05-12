import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import {
    determineComposerRoot,
    isComposerRoot,
    readJsonFile,
} from "../src/utils";
import { resolve } from "node:path";
import mockFs from "mock-fs";

beforeAll(() => {
    mockFs({
        "/path/to/fixtures": mockFs.load(resolve(__dirname, "fixtures")),
    });
});
afterAll(() => {
    mockFs.restore();
});

describe("isComposerRoot", () => {
    test("checks project composer.json to be valid root composer file", () => {
        expect(
            isComposerRoot("/path/to/fixtures/composerProject/composer.json"),
        ).toBe(true);
    });
    test("checks extension composer.json to be invalid root composer file", () => {
        expect(
            isComposerRoot(
                "/path/to/fixtures/composerProject/packages/composerExtension/composer.json",
            ),
        ).toBe(false);
    });
    test("checks library composer.json to be invalid root composer file", () => {
        expect(
            isComposerRoot(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toBe(false);
    });
});

describe("readJsonFile", () => {
    test("reads composer.json as json", () => {
        expect(
            readJsonFile(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toEqual({ type: "library" });
    });
});

describe("determineComposerRoot", () => {
    test("determines composer root from extension path", () => {
        expect(
            determineComposerRoot(
                "/path/to/fixtures/composerProject/packages/composerExtension",
            ),
        ).toBe("/path/to/fixtures/composerProject");
    });
    test("determines composer root from library path", () => {
        expect(
            determineComposerRoot(
                "/path/to/fixtures/composerProject/vendor/namespace/library",
            ),
        ).toBe("/path/to/fixtures/composerProject");
    });
    test("determines composer root from root path", () => {
        expect(determineComposerRoot("/path/to/fixtures/composerProject")).toBe(
            "/path/to/fixtures/composerProject",
        );
    });
    test("determines composer root from other path", () => {
        expect(
            determineComposerRoot("/path/to/fixtures/composerProject/packages"),
        ).toBe("/path/to/fixtures/composerProject");
    });

    test("fail to determine composer root from extension path", () => {
        expect(
            determineComposerRoot(
                "/path/to/fixtures/nonComposerProject/typo3conf/ext/non_composer_extension",
            ),
        ).toBe(
            "/path/to/fixtures/nonComposerProject/typo3conf/ext/non_composer_extension",
        );
    });
    test("fail to determine composer root from extension path with fallback root specified", () => {
        expect(
            determineComposerRoot(
                "/path/to/fixtures/nonComposerProject/typo3conf/ext/non_composer_extension",
                "/path/to/fixtures/nonComposerProject",
            ),
        ).toBe("/path/to/fixtures/nonComposerProject");
    });
});
