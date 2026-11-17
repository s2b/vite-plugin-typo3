import { constants } from "node:os";
import type { Logger, ViteDevServer } from "vite";
import colors from "picocolors";
import type { DevServerStatusConfig } from "./types.js";
import { updateEnvFile } from "./utils.js";

// Module-level state: Vite creates new plugin instances on every dev server
// restart, but process handlers should only be registered once per process
let runningServer:
    | { config: DevServerStatusConfig; logger: Logger }
    | undefined;

export function trackDevServerStatus(
    server: ViteDevServer,
    config: DevServerStatusConfig,
    logger: Logger,
): void {
    // There's no http server in middleware mode
    if (!config.enabled || !server.httpServer) {
        return;
    }

    // No "close" handler on purpose: status should stay "running" during restarts
    server.httpServer.once("listening", () => {
        // runningServer is only reset on exit, so this happens once per process
        if (!runningServer) {
            bindProcessHandlers();
        }
        runningServer = { config, logger };
        writeStatus(true);
    });
}

function bindProcessHandlers(): void {
    // Covers regular exits, process.exit() (used by Vite on SIGTERM and "q"),
    // uncaught exceptions and unhandled promise rejections
    process.on("exit", () => writeStatus(false));

    // Without a listener, Node.js terminates on SIGINT (Ctrl+C) and SIGHUP
    // (closed terminal) without emitting "exit". SIGTERM is handled by Vite.
    for (const signal of ["SIGINT", "SIGHUP"] as const) {
        process.on(signal, () => process.exit(128 + constants.signals[signal]));
    }
}

function writeStatus(status: boolean): void {
    if (!runningServer) {
        return;
    }
    const { config, logger } = runningServer;
    if (!status) {
        runningServer = undefined;
    }
    try {
        if (updateEnvFile(config, status)) {
            logger.info(
                `Dev server status written to ${config.envFile} (${config.variableName}=${Number(status)})`,
                { timestamp: true },
            );
        }
    } catch (err: any) {
        logger.error(colors.red(err.message), { timestamp: true });
    }
}
