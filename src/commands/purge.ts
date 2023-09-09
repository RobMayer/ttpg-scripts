import { Logger, assertSetup, loadConfig, pathExists } from "../common";
import * as fs from "fs/promises";
import * as readline from "readline/promises";
import * as chalk from "colorette";
import * as path from "path";

export const runPurge = async () => {
    await assertSetup();

    const config = await loadConfig();

    const prodPath = path.resolve(config.local.ttpg_path, config.project.slug);

    if (await pathExists(prodPath)) {
        const input = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const confirm = process.argv.includes("-y")
            ? "y"
            : (
                  await input.question(
                      chalk.whiteBright(`This will remove directory '${config.project.slug}' - a production build of your package - from your ttpg folder. Do you wish to proceed (y/n)? `)
                  )
              )
                  .trim()
                  .toLowerCase();

        const curManifest = JSON.parse(await fs.readFile(path.resolve(prodPath, "Manifest.json"), "utf8"));
        if ("ModID" in curManifest) {
            const grabModId = process.argv.includes("-y")
                ? true
                : (await input.question("There is a ModID associated with this production package, would you like to save it before purging (y/n")).trim().toLowerCase() === "y";
            input.close();
            if (grabModId) {
                config.project.modId = Number(curManifest.ModID);
                await fs.writeFile(path.resolve("./ttpgcfg.project.json"), JSON.stringify(config.project), "utf-8");
            }
        } else {
            input.close();
        }
        if (confirm === "y") {
            Logger.log("removing production build from ttpg");
            try {
                await fs.rm(prodPath, { recursive: true });
                Logger.success("production build removed");
            } catch (e) {
                Logger.error("Could not remove production build");
                throw e;
            }
        }
    } else {
        Logger.warning("There is no production build in your ttpg folder - aborting");
    }
};
