#!/usr/bin/env node

import { runSetup } from "./commands/setup";
import { runStatus } from "./commands/status";
import { runDev } from "./commands/dev";
import { runClean } from "./commands/clean";
import { runReset } from "./commands/reset";
import { Logger, guid } from "./common";
import { runBuild } from "./commands/build";
import { runPurge } from "./commands/purge";
import path = require("path");
import { runLibpack } from "./commands/libpack";
import { runHelp } from "./help";
import { runWatch } from "./commands/watch";

const cmd = process.argv[2] ?? "setup";

const HANDLERS = {
    clean: runClean,
    reset: runReset,
    dev: runDev,
    status: runStatus,
    setup: runSetup,
    build: runBuild,
    purge: runPurge,
    libpack: runLibpack,
    help: runHelp,
    watch: runWatch,
} as const;

const runCommand = async () => {
    if (cmd in HANDLERS) {
        return await HANDLERS[cmd as keyof typeof HANDLERS]();
    }
    throw Error(`Unrecognized Command ${cmd}`);
};

if (cmd === "guid") {
    const count = Math.max(1, isNaN(Number(process.argv[3])) ? 1 : Number(process.argv[3]));
    for (let i = 1; i <= count; i++) {
        console.log(guid());
    }
} else {
    Logger.welcome();
    runCommand()
        .then(() => {
            Logger.complete();
        })
        .catch((e) => {
            Logger.error("Something went wrong");
            console.error(e);
        });
}
