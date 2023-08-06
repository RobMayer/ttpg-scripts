import path = require("path");
import { ASSET_DIRS, Logger, ensureLocalConfig, ensureProjectConfig, loadConfig, pathExists } from "../common";
import * as fs from "fs/promises";

export const runSetup = async () => {
    Logger.notice("Checking for Local Config");
    if (await pathExists("./ttpgcfg.local.json")) {
        Logger.success("Local config found");
    } else {
        Logger.warning("Local Config is missing");
        await ensureLocalConfig();
    }
    Logger.notice("Checking for project config");
    if (await pathExists(path.resolve("./ttpgcfg.project.json"))) {
        Logger.success("Project config found");
    } else {
        Logger.warning("Project config is missing");
        await ensureProjectConfig();
    }
    Logger.notice("Setting up dev directory");

    if (!(await pathExists(path.resolve("./assets/")))) {
        Logger.notice("creating asset directories");
        try {
            await Promise.all(ASSET_DIRS.map((dir) => fs.mkdir(path.resolve("assets", dir), { recursive: true })));
            Logger.success("asset directories created");
        } catch (e) {
            Logger.error("Failed to create asset directories");
            throw e;
        }
    }
};
