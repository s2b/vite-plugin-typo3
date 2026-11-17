import { test, expect, vi } from "vitest";
import { build, createServer } from "vite";
import typo3 from "../../src";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

    expect(sortedOutput).toHaveLength(8);

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
    ).toMatchInlineSnapshot(`"assets/Scss-[hash].css"`);
    const scssSource = (sortedOutput[4] as OutputAsset).source;
    expect(scssSource).toContain(".scss-main{background:green}");
    expect(scssSource).toContain(".module{color:orange}"); // @use
    expect(scssSource).toContain(".partial{color:#00f}"); // @import

    expect(
        withoutHashes((sortedOutput[5] as OutputChunk).fileName),
    ).toMatchInlineSnapshot(`"assets/Scss.entry-[hash].js"`);
    expect((sortedOutput[5] as OutputChunk).code).not.toContain("scss-main");

    expect(
        withoutHashes((sortedOutput[6] as OutputAsset).fileName),
    ).toMatchInlineSnapshot(`"assets/Vendor-[hash].css"`);
    expect((sortedOutput[6] as OutputAsset).source).toContain(
        "body{background:#00f}",
    );

    expect(
        withoutHashes((sortedOutput[7] as OutputChunk).fileName),
    ).toMatchInlineSnapshot(`"assets/Vendor.entry-[hash].js"`);
    expect((sortedOutput[7] as OutputChunk).code).toContain("Vendor.ts");
});

async function createDevServer(envFile: string) {
    const server = await createServer({
        root: join(__dirname, "project"),
        plugins: [typo3({ devServerStatus: { envFile } })],
        logLevel: "silent",
    });
    await server.close();
    return server;
}

function hasIgnoreFunction(server: Awaited<ReturnType<typeof createServer>>) {
    return [server.config.server.watch?.ignored]
        .flat()
        .some((pattern) => typeof pattern === "function");
}

test("devServerStatus is disabled with a warning if env file is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const server = await createDevServer("does-not-exist.env");
    expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("does-not-exist.env"),
    );
    expect(hasIgnoreFunction(server)).toBe(false);
    warn.mockRestore();
});

test("devServerStatus excludes existing env file from watching", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-typo3-"));
    const envFile = join(dir, ".env");
    writeFileSync(envFile, "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
        const server = await createDevServer(envFile);
        expect(warn).not.toHaveBeenCalled();
        expect(hasIgnoreFunction(server)).toBe(true);
    } finally {
        warn.mockRestore();
        rmSync(dir, { recursive: true });
    }
});
