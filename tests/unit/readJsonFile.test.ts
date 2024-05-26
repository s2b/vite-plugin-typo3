import { describe, expect, test, jest } from "@jest/globals";
import { readJsonFile } from "../../src/utils";

jest.mock("node:fs");

describe("readJsonFile", () => {
    test("read composer.json as json", () => {
        expect(
            readJsonFile(
                "/path/to/fixtures/composerProject/vendor/namespace/library/composer.json",
            ),
        ).toEqual({ type: "library" });
    });
    test("read non-existent file", () => {
        expect(() => {
            readJsonFile("/path/to/dummy/composer.json");
        }).toThrow();
    });
    test("read invalid json file", () => {
        expect(() => {
            readJsonFile("/path/to/fixtures/invalid.json");
        }).toThrow(SyntaxError);
    });
});
