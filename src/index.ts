#!/usr/bin/env node

import * as chalk from "colorette";
import { runSetup } from "./commands/setup";
import { runStatus } from "./commands/status";
import { runDev } from "./commands/dev";
import { runClean } from "./commands/clean";
import { runReset } from "./commands/reset";
import { Logger } from "./common";
import { runBuild } from "./commands/build";
import { runPurge } from "./commands/purge";

const cmd = process.argv[2] ?? "setup";

const HANDLERS = {
    clean: runClean,
    reset: runReset,
    dev: runDev,
    status: runStatus,
    setup: runSetup,
    build: runBuild,
    purge: runPurge,
} as const;

const runCommand = async () => {
    if (cmd in HANDLERS) {
        return await HANDLERS[cmd as keyof typeof HANDLERS]();
    }
    throw Error(`Unrecognized Command ${cmd}`);
};

Logger.welcome();
runCommand()
    .then(() => {
        Logger.complete();
    })
    .catch((e) => {
        Logger.error("Something went wrong");
        console.error(e);
    });
