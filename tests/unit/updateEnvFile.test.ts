import { describe, expect, test, vi } from "vitest";
import { updateEnvFile } from "../../src/utils";
import { DevServerStatusConfig } from "../../src/types";
import { fs as memfs, vol } from "memfs";

vi.mock("node:fs");
vi.mock("node:fs/promises");

const envFile = "/path/to/project/.env";
const config: DevServerStatusConfig = {
    enabled: true,
    envFile,
    variableName: "VAR",
};

function update(contents: string, status: boolean, variableName = "VAR") {
    vol.reset();
    vol.fromJSON({ [envFile]: contents });
    updateEnvFile({ ...config, variableName }, status);
    return vol.readFileSync(envFile, "utf-8");
}

type Case = [name: string, before: string, status: boolean, after: string];

const casesForBothStatuses = [true, false].flatMap((status): Case[] => {
    const value = Number(status);
    return [
        ["appends to empty file", "", status, `VAR=${value}\n`],
        [
            "appends to file without trailing newline",
            "FOO=bar",
            status,
            `FOO=bar\nVAR=${value}`,
        ],
        [
            "appends to file with trailing newline",
            "FOO=bar\n",
            status,
            `FOO=bar\nVAR=${value}\n`,
        ],
        [
            "replaces existing value 0 in the middle of the file",
            "FOO=bar\nVAR=0\nBAZ=qux\n",
            status,
            `FOO=bar\nVAR=${value}\nBAZ=qux\n`,
        ],
        [
            "replaces existing value 1 in the middle of the file",
            "FOO=bar\nVAR=1\nBAZ=qux\n",
            status,
            `FOO=bar\nVAR=${value}\nBAZ=qux\n`,
        ],
        [
            "replaces existing value at the start of the file",
            "VAR=0\nFOO=bar\n",
            status,
            `VAR=${value}\nFOO=bar\n`,
        ],
        [
            "replaces existing value at the end of the file",
            "FOO=bar\nVAR=0",
            status,
            `FOO=bar\nVAR=${value}`,
        ],
        [
            "replaces existing value as the only line",
            "VAR=1",
            status,
            `VAR=${value}`,
        ],
    ];
});

const cases: Case[] = [
    ...casesForBothStatuses,
    [
        "does not match variables that only share a prefix or suffix",
        "VAR_OLD=0\nMY_VAR=0\n",
        true,
        "VAR_OLD=0\nMY_VAR=0\nVAR=1\n",
    ],
    [
        "does not touch commented out variable",
        "# VAR=0\n",
        true,
        "# VAR=0\nVAR=1\n",
    ],
    [
        "replaces all duplicate definitions",
        "VAR=1\nFOO=bar\nVAR=1\n",
        false,
        "VAR=0\nFOO=bar\nVAR=0\n",
    ],
    [
        "replaces existing value in CRLF file",
        "FOO=bar\r\nVAR=0\r\nBAZ=qux\r\n",
        true,
        "FOO=bar\r\nVAR=1\r\nBAZ=qux\r\n",
    ],
    [
        "replaces existing value at the end of CRLF file",
        "FOO=bar\r\nVAR=0",
        true,
        "FOO=bar\r\nVAR=1",
    ],
    [
        "appends to CRLF file with trailing newline",
        "FOO=bar\r\n",
        true,
        "FOO=bar\r\nVAR=1\r\n",
    ],
    [
        "appends with CRLF line ending to CRLF file",
        "FOO=bar\r\nBAZ=qux",
        true,
        "FOO=bar\r\nBAZ=qux\r\nVAR=1",
    ],
    ...["true", "false", '"1"', "", "1 # comment", "10"].map(
        (existing): Case => [
            `replaces existing value '${existing}'`,
            `FOO=bar\nVAR=${existing}\nBAZ=qux\n`,
            false,
            "FOO=bar\nVAR=0\nBAZ=qux\n",
        ],
    ),
];

describe("updateEnvFile", () => {
    test.each(cases)("%s (%j, status %s)", (_, before, status, after) => {
        expect(update(before, status)).toBe(after);
    });
    test("uses custom variable name", () => {
        expect(update("FOO=bar\nMY_VAR=0\n", true, "MY_VAR")).toBe(
            "FOO=bar\nMY_VAR=1\n",
        );
    });
    test("treats regex characters in variable name literally", () => {
        expect(update("VITEXSERVER=0\n", true, "VITE.SERVER")).toBe(
            "VITEXSERVER=0\nVITE.SERVER=1\n",
        );
    });
    test.each(["FOO=bar\n", "FOO=bar\r\n"])(
        "file %j stays stable across repeated start/stop cycles",
        (contents) => {
            const afterFirstWrite = update(contents, true);
            for (let i = 0; i < 5; i++) {
                updateEnvFile(config, false);
                updateEnvFile(config, true);
            }
            expect(vol.readFileSync(envFile, "utf-8")).toBe(afterFirstWrite);
        },
    );
    test("only writes the file if its contents change", () => {
        vol.fromJSON({ [envFile]: "VAR=1\n" });
        const writeFileSync = vi.spyOn(memfs, "writeFileSync");
        expect(updateEnvFile(config, true)).toBe(false);
        expect(writeFileSync).not.toHaveBeenCalled();
        expect(updateEnvFile(config, false)).toBe(true);
        expect(writeFileSync).toHaveBeenCalledTimes(1);
        writeFileSync.mockRestore();
    });
    test("throws for non-existent file without creating it", () => {
        vol.reset();
        expect(() => updateEnvFile(config, true)).toThrow("ENOENT");
        expect(vol.existsSync(envFile)).toBe(false);
    });
});
