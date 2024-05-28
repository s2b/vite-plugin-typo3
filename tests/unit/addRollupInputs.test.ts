import { describe, test, expect } from "vitest";
import { addRollupInputs } from "../../src/utils";

describe("addRollupInputs", () => {
    test("existing string input", () => {
        expect(addRollupInputs("path/to/input.js", [])).toEqual([
            "path/to/input.js",
        ]);
        expect(
            addRollupInputs("path/to/input.js", [
                "path/to/additional/input.js",
            ]),
        ).toEqual(["path/to/input.js", "path/to/additional/input.js"]);
    });
    test("existing array input", () => {
        expect(
            addRollupInputs(
                ["path/to/input1.js", "path/to/input2.js"],
                ["path/to/additional/input.js"],
            ),
        ).toEqual([
            "path/to/input1.js",
            "path/to/input2.js",
            "path/to/additional/input.js",
        ]);
    });
    test("existing object input", () => {
        expect(
            addRollupInputs(
                { input1: "path/to/input1.js", input2: "path/to/input2.js" },
                ["path/to/additional/input.js"],
            ),
        ).toEqual({
            input1: "path/to/input1.js",
            input2: "path/to/input2.js",
            "0": "path/to/additional/input.js",
        });
    });
});
