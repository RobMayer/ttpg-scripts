#!/usr/bin/env node

import chalk  from "colorette";
import { runSetup } from "./setup";

const cmd = process.argv[2] ?? "setup";

const runCommand = async () => {
    switch (cmd) {
        case "setup": return await runSetup();
    }
    throw Error("Unrecognized Command");
}

console.log(chalk.whiteBright("Good Morning, Captain!"));
runCommand().then(() => {
    console.log(chalk.greenBright("Good Hunting!"));
}).catch((e) => {
    console.error(chalk.redBright("Something went wrong"));
    console.error(e);
})
