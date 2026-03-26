import { test, expect } from "vitest";
import { build } from "vite";
import typo3 from "../../src";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RolldownOutput, OutputChunk, OutputAsset } from "rolldown";
import { UserConfig } from "../../src/types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

interface TestCase {
    projectName: string;
    pluginConfig: UserConfig;
}

test.for<TestCase>([
    { projectName: "project", pluginConfig: {} },
    {
        projectName: "uninitializedProject",
        pluginConfig: {
            composerPackagePaths: [
                "packages/test_extension/",
                "vendor/test-vendor/vendor-extension/",
            ],
        },
    },
])("vite build works for TYPO3 project $projectName", async (testCase) => {
    const root = join(__dirname, testCase.projectName);
    const output = (await build({
        root,
        plugins: [typo3(testCase.pluginConfig)],
    })) as RolldownOutput;

    const sortedOutput: (OutputAsset | OutputChunk)[] = output.output.sort(
        (a, b) => (a.fileName < b.fileName ? -1 : 1),
    );

    expect(sortedOutput).toHaveLength(6);

    expect((sortedOutput[0] as OutputAsset).fileName).toBe(
        ".vite/manifest.json",
    );
    await expect((sortedOutput[0] as OutputAsset).source).toMatchFileSnapshot(
        "manifest-expected.json",
    );

    expect((sortedOutput[1] as OutputChunk).fileName).toMatchInlineSnapshot(
        `"assets/Alt.entry-BoPKGVcr.js"`,
    );
    expect((sortedOutput[1] as OutputChunk).code).toMatchInlineSnapshot(
        `"console.log(\`Alt.entry.ts\`);"`,
    );

    expect((sortedOutput[2] as OutputAsset).fileName).toMatchInlineSnapshot(
        `"assets/Main-VWk4xp3e.css"`,
    );
    expect((sortedOutput[2] as OutputAsset).source).toMatchInlineSnapshot(`
      "body{background:red}
      "
    `);

    expect((sortedOutput[3] as OutputChunk).fileName).toMatchInlineSnapshot(
        `"assets/Main.entry-49EpidS1.js"`,
    );
    expect((sortedOutput[3] as OutputChunk).code).toMatchInlineSnapshot(
        `"console.log(\`Main.ts\`);"`,
    );

    expect((sortedOutput[4] as OutputAsset).fileName).toMatchInlineSnapshot(
        `"assets/Vendor-DE25tVp9.css"`,
    );
    expect((sortedOutput[4] as OutputAsset).source).toMatchInlineSnapshot(`
      "body{background:#00f}
      "
    `);

    expect((sortedOutput[5] as OutputChunk).fileName).toMatchInlineSnapshot(
        `"assets/Vendor.entry-Bk2RJPqq.js"`,
    );
    expect((sortedOutput[5] as OutputChunk).code).toMatchInlineSnapshot(
        `"console.log(\`Vendor.ts\`);"`,
    );
});
