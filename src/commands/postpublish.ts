import path = require("path");
import { Logger, assertSetup, loadConfig, pathExists } from "../common";
import * as fs from "fs/promises";

export const runPostPublish = async () => {
    await assertSetup();

    const config = await loadConfig();

    const prodPath = path.resolve(config.local.ttpg_path, config.project.slug);

    if (await pathExists(prodPath)) {
        const curManifest = JSON.parse(await fs.readFile(path.resolve(prodPath, "Manifest.json"), "utf8"));
        if ("ModID" in curManifest) {
            config.project.modId = Number(curManifest.ModID);
            await fs.writeFile(path.resolve("./ttpgcfg.project.json"), JSON.stringify(config.project), "utf-8");
            Logger.success(`Captured MOD.io Mod Id: ${curManifest.ModID}`);
        } else {
            Logger.warning("There was no mod Id in the package, have you published it yet?");
        }
    } else {
        Logger.warning("There is no production build in your ttpg folder - aborting");
    }
};
