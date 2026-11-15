import { describe, test, expect } from "vitest";
import { addFileToWatchIgnoreList } from "../../src/utils";

describe("addFileToWatchIgnoreList", () => {
    const file = "/path/to/project/.env";

    test("no existing ignore list", () => {
        const result = addFileToWatchIgnoreList(undefined, file);
        expect(result).toHaveLength(1);
    });
    test("preserves existing array", () => {
        const result = addFileToWatchIgnoreList(["**/var/**", /foo/], file);
        expect(result.slice(0, 2)).toEqual(["**/var/**", /foo/]);
        expect(result).toHaveLength(3);
    });
    test("preserves single existing matcher", () => {
        const result = addFileToWatchIgnoreList("**/var/**", file);
        expect(result[0]).toBe("**/var/**");
        expect(result).toHaveLength(2);
    });
    test("added matcher only matches the env file", () => {
        const matcher = addFileToWatchIgnoreList(undefined, file)[0] as (
            path: string,
        ) => boolean;
        expect(matcher("/path/to/project/.env")).toBe(true);
        expect(matcher("/path/to/project/sub/../.env")).toBe(true);
        expect(matcher("/path/to/project/.env.local")).toBe(false);
        expect(matcher("/path/to/other/.env")).toBe(false);
    });
});
