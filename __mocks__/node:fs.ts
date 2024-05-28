import { vi } from "vitest";
import { vol, type DirectoryJSON } from "memfs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fs = await vi.importActual<typeof import("node:fs")>("node:fs");

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const fixturePath = resolve(__dirname, "../tests/unit/fixtures");
const fixtureMount = "/path/to/fixtures";

function createFixtureDirectoryStructure(
    path: string,
    replaceRoot: string,
    root = path,
): DirectoryJSON {
    let files: any = {};
    const items = fs.readdirSync(path);
    for (let item of items) {
        item = join(path, item);
        const stat = fs.lstatSync(item);
        if (stat.isDirectory()) {
            files = {
                ...files,
                ...createFixtureDirectoryStructure(item, replaceRoot, root),
            };
        } else if (stat.isFile()) {
            files[item.replace(root, replaceRoot)] = fs.readFileSync(
                item,
                "utf8",
            );
        }
    }
    return files;
}

const fixtureFiles = createFixtureDirectoryStructure(fixturePath, fixtureMount);

vol.fromJSON(fixtureFiles);

export default vol;
