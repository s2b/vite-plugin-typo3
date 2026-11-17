import { test, expect } from "vitest";
import { build } from "vite";
import typo3 from "../../src";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

test("vite build works for TYPO3 extension", async () => {
    const root = join(__dirname, "project/packages/test_extension");
    const output = await build({
        root,
        plugins: [typo3({ target: "extension" })],
        build: {
            lib: {
                cssFileName: "style",
            },
        },
    });

    expect(output).toHaveLength(2);

    for (const [format, extension] of [
        [output[0], "js"],
        [output[1], "cjs"],
    ] as const) {
        expect(format.output.map((file) => file.fileName)).toEqual([
            `Alt.entry.${extension}`,
            `Main.entry.${extension}`,
            `Scss.entry.${extension}`,
            "style.css",
        ]);
        const [alt, main, scss, style] = format.output;
        expect(alt.code).toContain("Alt.entry.ts");
        expect(main.code).toContain("Main.ts");
        expect(scss.code).not.toContain("scss-main");
        expect(style.source).toContain("body{background:red}");
        expect(style.source).toContain(".scss-main{background:green}");
        expect(style.source).toContain(".module{color:orange}"); // @use
        expect(style.source).toContain(".partial{color:#00f}"); // @import
    }
});
