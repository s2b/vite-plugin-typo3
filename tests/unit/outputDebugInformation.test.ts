import { describe, test, expect, jest } from "@jest/globals";
import { outputDebugInformation } from "../../src/utils";
import { type Logger } from "vite";
import colors from "picocolors";

function mockLogger(): Logger {
    return {
        info: jest.fn<jest.Mock<Logger["info"]>>(),
        warn: jest.fn<Logger["warn"]>(),
        warnOnce: jest.fn<Logger["warnOnce"]>(),
        error: jest.fn<Logger["error"]>(),
        clearScreen: jest.fn<Logger["clearScreen"]>(),
        hasErrorLogged: jest.fn<Logger["hasErrorLogged"]>(),
        hasWarned: false,
    };
}

describe("outputDebugInformation", () => {
    test("one entrypoint from two extensions", () => {
        const logger = mockLogger();
        outputDebugInformation(
            [
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension1",
                    path: "/path/to/dummy/extension1",
                },
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension2",
                    path: "/path/to/dummy/extension2",
                },
            ],
            ["/path/to/dummy/entrypoint.js"],
            {
                type: "project",
                path: "/path/to/dummy",
            },
            logger,
        );

        expect(logger.info).toHaveBeenCalledTimes(3);
        expect(logger.info).toHaveBeenNthCalledWith(
            1,
            "The following extensions with vite entrypoints have been recognized: " +
                colors.green("test_extension1, test_extension2"),
            { timestamp: true },
        );
        expect(logger.info).toHaveBeenNthCalledWith(
            2,
            "The following aliases have been defined: " +
                colors.green("@test_extension1, @test_extension2"),
            { timestamp: true },
        );
        expect(logger.info).toHaveBeenNthCalledWith(
            3,
            "The following entrypoints will be served:\n" +
                colors.green("➜ entrypoint.js"),
            { timestamp: true },
        );
    });

    test("no entrypoint from one extensions", () => {
        const logger = mockLogger();
        outputDebugInformation(
            [
                {
                    type: "typo3-cms-extension",
                    extensionKey: "test_extension1",
                    path: "/path/to/dummy/extension1",
                },
            ],
            [],
            {
                type: "project",
                path: "/path/to/dummy",
            },
            logger,
        );

        expect(logger.info).toHaveBeenCalledTimes(2);
    });

    test("no extensions", () => {
        const logger = mockLogger();
        outputDebugInformation(
            [],
            [],
            {
                type: "project",
                path: "/path/to/dummy",
            },
            logger,
        );

        expect(logger.info).toHaveBeenCalledTimes(0);
    });
});
