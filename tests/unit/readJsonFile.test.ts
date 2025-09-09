import { beforeEach, describe, expect, test, vi } from "vitest";
import { readJsonFile } from "../../src/utils";
import { vol } from "memfs";
import fixtureDirectoryStructure from "./fixtureDirectoryStructure";

vi.mock("node:fs");
vi.mock("node:fs/promises");

beforeEach(() => {
    vol.fromJSON(fixtureDirectoryStructure);
});

describe("readJsonFile", () => {
    test("read composer.json as json", () => {
        expect(
            readJsonFile(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toEqual({ type: "library" });
    });
    test("read non-existent file", () => {
        vol.fromJSON(fixtureDirectoryStructure);
        expect(() => {
            readJsonFile("/path/to/dummy/composer.json");
        }).toThrow();
    });
    test("read invalid json file", () => {
        vol.fromJSON(fixtureDirectoryStructure);
        expect(() => {
            readJsonFile("/path/to/fixtures/invalid.json");
        }).toThrow(SyntaxError);
    });
});
