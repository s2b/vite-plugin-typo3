import { test, expect } from "vitest";
import { build } from "vite";
import typo3 from "../../src";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { UserConfig } from "../../src/types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface TestCase {
    projectName: string;
    pluginConfig: UserConfig;
}

test.for<TestCase>([
    { projectName: "project", pluginConfig: {} },
    { projectName: "uninitializedProject", pluginConfig: {} },
])("vite build works for TYPO3 extension in $projectName", async (testCase) => {
    const root = join(
        __dirname,
        `${testCase.projectName}/packages/test_extension`,
    );
    const output = await build({
        root,
        plugins: [typo3({ target: "extension", ...testCase.pluginConfig })],
        build: {
            // @ts-expect-error "entry" is specified by plugin, so no need to specify it here
            lib: {
                cssFileName: "style",
            },
        },
    });

    expect(output).toHaveLength(2);

    const esmOutput = output[0];

    expect(esmOutput.output).toHaveLength(3);
    expect(esmOutput.output[0].fileName).toMatchInlineSnapshot(
        `"Alt.entry.js"`,
    );
    expect(esmOutput.output[0].code).toMatchInlineSnapshot(`
      "console.log("Alt.entry.ts");
      "
    `);
    expect(esmOutput.output[1].fileName).toMatchInlineSnapshot(
        `"Main.entry.js"`,
    );
    expect(esmOutput.output[1].code).toMatchInlineSnapshot(`
      "console.log("Main.ts");
      "
    `);
    expect(esmOutput.output[2].fileName).toMatchInlineSnapshot(`"style.css"`);
    expect(esmOutput.output[2].source).toMatchInlineSnapshot(`
      "body{background:red}
      "
    `);

    const cjsOutput = output[1];
    expect(cjsOutput.output).toHaveLength(3);
    expect(cjsOutput.output[0].fileName).toMatchInlineSnapshot(
        `"Alt.entry.cjs"`,
    );
    expect(cjsOutput.output[0].code).toMatchInlineSnapshot(`
      ""use strict";console.log("Alt.entry.ts");
      "
    `);
    expect(cjsOutput.output[1].fileName).toMatchInlineSnapshot(
        `"Main.entry.cjs"`,
    );
    expect(cjsOutput.output[1].code).toMatchInlineSnapshot(`
      ""use strict";console.log("Main.ts");
      "
    `);
    expect(cjsOutput.output[2].fileName).toMatchInlineSnapshot(`"style.css"`);
    expect(cjsOutput.output[2].source).toMatchInlineSnapshot(`
      "body{background:red}
      "
    `);
});
