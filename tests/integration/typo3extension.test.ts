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
            cssCodeSplit: true,
        },
    });

    expect(output).toHaveLength(2);

    const esmOutput = output[0];

    expect(esmOutput.output).toHaveLength(5);
    expect(esmOutput.output[0].fileName).toMatchInlineSnapshot(
        `"Alt.entry.js"`,
    );
    expect(esmOutput.output[0].code).toContain("Alt.entry.ts");
    expect(esmOutput.output[1].fileName).toMatchInlineSnapshot(
        `"Main.entry.js"`,
    );
    expect(esmOutput.output[1].code).toContain("Main.ts");
    expect(esmOutput.output[2].fileName).toMatchInlineSnapshot(
        `"Scss.entry.js"`,
    );
    expect(esmOutput.output[2].code).not.toContain("scss-main");
    expect(esmOutput.output[3].fileName).toMatchInlineSnapshot(`"Main.css"`);
    expect(esmOutput.output[3].source).toContain("body{background:red}");
    expect(esmOutput.output[4].fileName).toMatchInlineSnapshot(`"Scss.css"`);
    expect(esmOutput.output[4].source).toContain(
        ".partial{color:#00f}.scss-main{background:green}",
    );

    const cjsOutput = output[1];
    expect(cjsOutput.output).toHaveLength(5);
    expect(cjsOutput.output[0].fileName).toMatchInlineSnapshot(
        `"Alt.entry.cjs"`,
    );
    expect(cjsOutput.output[0].code).toContain("Alt.entry.ts");
    expect(cjsOutput.output[1].fileName).toMatchInlineSnapshot(
        `"Main.entry.cjs"`,
    );
    expect(cjsOutput.output[1].code).toContain("Main.ts");
    expect(cjsOutput.output[2].fileName).toMatchInlineSnapshot(
        `"Scss.entry.cjs"`,
    );
    expect(cjsOutput.output[2].code).not.toContain("scss-main");
    expect(cjsOutput.output[3].fileName).toMatchInlineSnapshot(`"Main.css"`);
    expect(cjsOutput.output[3].source).toContain("body{background:red}");
    expect(cjsOutput.output[4].fileName).toMatchInlineSnapshot(`"Scss.css"`);
    expect(cjsOutput.output[4].source).toContain(
        ".partial{color:#00f}.scss-main{background:green}",
    );
});
