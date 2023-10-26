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

        const prodManifest = JSON.parse(await fs.readFile(path.resolve(prodPath, "Manifest.json"), "utf8"));

        const saveProdInfo = process.argv.includes("-y") ? true : (await input.question("Save and mod.io data (thumbnail & id), if present, before purging (y/n")).trim().toLowerCase() === "y";
        input.close();

        if (saveProdInfo) {
            if ("ModID" in prodManifest) {
                config.project.modId = Number(prodManifest.ModID);
                await fs.writeFile(path.resolve("./ttpgcfg.project.json"), JSON.stringify(config.project), "utf-8");
            }
            if (!(await pathExists(path.resolve("./Thumbnail.png"))) && (await pathExists(path.resolve(prodPath, "Thumbnail.png")))) {
                await fs.copyFile(path.resolve(prodPath, "Thumbnail.png"), path.resolve("./Thumbnail.png"));
            }
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
