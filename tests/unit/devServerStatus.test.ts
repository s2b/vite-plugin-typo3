import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EventEmitter } from "node:events";
import { vol } from "memfs";
import type { Logger, ViteDevServer } from "vite";
import type { DevServerStatusConfig } from "../../src/types";

vi.mock("node:fs");
vi.mock("node:fs/promises");

const envFile = "/path/to/project/.env";
const config: DevServerStatusConfig = {
    enabled: true,
    envFile,
    variableName: "VITE_SERVER_RUNNING",
};

// Capture process handlers instead of registering them on the test runner's process
let processHandlers: Map<string, (() => void)[]>;
let exitSpy: ReturnType<typeof vi.spyOn>;

// devServerStatus.ts keeps module-level state, so it needs to be
// re-imported for each test to start with a clean slate
async function importModule() {
    const module = await import("../../src/devServerStatus");
    // Dependencies (e. g. rolldown via vite) register their own process
    // handlers on import, which are irrelevant for these tests
    processHandlers.clear();
    return module;
}

function createServer(withHttpServer = true) {
    const httpServer = new EventEmitter();
    const server = {
        httpServer: withHttpServer ? httpServer : null,
    } as unknown as ViteDevServer;
    return { server, httpServer };
}

function createLogger(): Logger {
    return { info: vi.fn(), error: vi.fn() } as unknown as Logger;
}

function readEnvFile(): string {
    return vol.readFileSync(envFile, "utf-8") as string;
}

function readStatus(): string | undefined {
    return readEnvFile().match(/^VITE_SERVER_RUNNING=(.*)$/m)?.[1];
}

function expectNoProcessHandlers() {
    for (const event of ["exit", "SIGINT", "SIGHUP", "SIGTERM"]) {
        expect(processHandlers.has(event)).toBe(false);
    }
}

function emitProcessEvent(event: string) {
    for (const handler of processHandlers.get(event) ?? []) {
        handler();
    }
}

beforeEach(() => {
    vi.resetModules();
    vol.reset();
    vol.fromJSON({ [envFile]: "FOO=bar\n" });
    processHandlers = new Map();
    vi.spyOn(process, "on").mockImplementation(((
        event: string,
        handler: () => void,
    ) => {
        processHandlers.set(event, [
            ...(processHandlers.get(event) ?? []),
            handler,
        ]);
        return process;
    }) as any);
    exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation((() => undefined) as any);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("trackDevServerStatus", () => {
    test("does nothing if disabled", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, { ...config, enabled: false }, logger);
        httpServer.emit("listening");
        expectNoProcessHandlers();
        expect(httpServer.listenerCount("listening")).toBe(0);
        expect(readEnvFile()).toBe("FOO=bar\n");
        expect(logger.info).not.toHaveBeenCalled();
    });
    test("does nothing in middleware mode", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server } = createServer(false);
        trackDevServerStatus(server, config, createLogger());
        expectNoProcessHandlers();
        expect(readEnvFile()).toBe("FOO=bar\n");
    });
    test("writes status when server starts listening", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, config, logger);
        expect(readStatus()).toBeUndefined();
        httpServer.emit("listening");
        expect(readStatus()).toBe("1");
        expect(logger.info).toHaveBeenCalledTimes(1);
    });
    test("keeps status when server closes (e. g. during restart)", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        trackDevServerStatus(server, config, createLogger());
        httpServer.emit("listening");
        httpServer.emit("close");
        expect(readStatus()).toBe("1");
    });
    test("writes status when process exits while server is running", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, config, logger);
        httpServer.emit("listening");
        emitProcessEvent("exit");
        expect(readStatus()).toBe("0");
        expect(logger.info).toHaveBeenCalledTimes(2);
    });
    test("writes status only once if exit is emitted multiple times", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, config, logger);
        httpServer.emit("listening");
        emitProcessEvent("exit");
        emitProcessEvent("exit");
        expect(logger.info).toHaveBeenCalledTimes(2);
    });
    test("does not register process handlers if server never started", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, config, logger);
        expectNoProcessHandlers();
        emitProcessEvent("exit");
        expect(readEnvFile()).toBe("FOO=bar\n");
        expect(logger.info).not.toHaveBeenCalled();
    });
    test.each([
        ["SIGINT", 130],
        ["SIGHUP", 129],
    ])("%s exits process with code %i", async (signal, exitCode) => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        trackDevServerStatus(server, config, createLogger());
        httpServer.emit("listening");
        emitProcessEvent(signal);
        expect(exitSpy).toHaveBeenCalledWith(exitCode);
    });
    test("leaves SIGTERM to vite", async () => {
        const { trackDevServerStatus } = await importModule();
        const { server, httpServer } = createServer();
        trackDevServerStatus(server, config, createLogger());
        httpServer.emit("listening");
        expect(processHandlers.has("exit")).toBe(true);
        expect(processHandlers.has("SIGTERM")).toBe(false);
    });
    test("registers process handlers only once across server restarts", async () => {
        const { trackDevServerStatus } = await importModule();
        const logger = createLogger();
        const first = createServer();
        trackDevServerStatus(first.server, { ...config }, logger);
        first.httpServer.emit("listening");

        // Restart: Vite creates a new server (and plugin instance), then closes the old one
        const second = createServer();
        trackDevServerStatus(second.server, { ...config }, logger);
        first.httpServer.emit("close");
        second.httpServer.emit("listening");
        expect(readStatus()).toBe("1");
        // Unchanged status is neither written nor logged again
        expect(logger.info).toHaveBeenCalledTimes(1);

        for (const event of ["exit", "SIGINT", "SIGHUP"]) {
            expect(processHandlers.get(event)).toHaveLength(1);
        }
        emitProcessEvent("exit");
        expect(readStatus()).toBe("0");
    });
    test("logs error instead of throwing if env file doesn't exist", async () => {
        const { trackDevServerStatus } = await importModule();
        vol.reset();
        const { server, httpServer } = createServer();
        const logger = createLogger();
        trackDevServerStatus(server, config, logger);
        expect(() => httpServer.emit("listening")).not.toThrow();
        expect(() => emitProcessEvent("exit")).not.toThrow();
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining(envFile),
            expect.anything(),
        );
    });
});
