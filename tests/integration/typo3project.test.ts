import { test, expect } from "vitest";
import { build } from "vite";
import typo3 from "../../src";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RolldownOutput, OutputChunk, OutputAsset } from "rolldown";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Content hashes differ between Rollup (Vite 7) and Rolldown (Vite 8)
function withoutHashes(value: string): string {
    return value.replace(/-[\w-]{8}\.(js|css)\b/g, "-[hash].$1");
}

test("vite build works for TYPO3 project", async () => {
    const root = join(__dirname, "project");
    const output = (await build({
        root,
        plugins: [typo3()],
    })) as RolldownOutput;

    const sortedOutput: (OutputAsset | OutputChunk)[] = output.output.sort(
        (a, b) => (a.fileName < b.fileName ? -1 : 1),
    );

    expect(sortedOutput).toHaveLength(6);

    expect((sortedOutput[0] as OutputAsset).fileName).toBe(
        ".vite/manifest.json",
    );
    await expect(
        withoutHashes((sortedOutput[0] as OutputAsset).source as string),
    ).toMatchFileSnapshot("manifest-expected.json");

    expect(
        withoutHashes((sortedOutput[1] as OutputChunk).fileName),
    ).toMatchInlineSnapshot(`"assets/Alt.entry-[hash].js"`);
    expect((sortedOutput[1] as OutputChunk).code).toContain("Alt.entry.ts");

    expect(
        withoutHashes((sortedOutput[2] as OutputAsset).fileName),
    ).toMatchInlineSnapshot(`"assets/Main-[hash].css"`);
    expect((sortedOutput[2] as OutputAsset).source).toContain(
        "body{background:red}",
    );

    expect(
        withoutHashes((sortedOutput[3] as OutputChunk).fileName),
    ).toMatchInlineSnapshot(`"assets/Main.entry-[hash].js"`);
    expect((sortedOutput[3] as OutputChunk).code).toContain("Main.ts");

    expect(
        withoutHashes((sortedOutput[4] as OutputAsset).fileName),
    ).toMatchInlineSnapshot(`"assets/Vendor-[hash].css"`);
    expect((sortedOutput[4] as OutputAsset).source).toContain(
        "body{background:#00f}",
    );

    expect(
        withoutHashes((sortedOutput[5] as OutputChunk).fileName),
    ).toMatchInlineSnapshot(`"assets/Vendor.entry-[hash].js"`);
    expect((sortedOutput[5] as OutputChunk).code).toContain("Vendor.ts");
});
