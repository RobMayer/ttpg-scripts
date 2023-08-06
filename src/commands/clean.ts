import * as path from "path";
import * as fs from "fs/promises";
import { pathExists, Logger, loadConfig } from "../common";

export const runClean = async () => {
    Logger.log("checking for local config");
    if (await pathExists("./ttpgcfg.local.json")) {
        Logger.success("Local config found");
        const config = await loadConfig();
        Logger.log("Checking for ttpg symlink");
        if (await pathExists(path.join(config.local.ttpg_path, `${config.project.slug}_dev`))) {
            Logger.success("ttpg symlink found - clearing...");
            try {
                await fs.rm(path.join(config.local.ttpg_path, `${config.project.slug}_dev`), { recursive: true });
                Logger.success("ttpg symlink cleared.");
            } catch (e) {
                Logger.error("Could not clear ttpg symlink");
                throw e;
            }
        } else {
            Logger.success("No symlink found");
        }
    } else {
        Logger.warning("No local config found. You might have a stray symlink in your ttpg folder");
    }
    if (await pathExists("./dev")) {
        Logger.log("clearing './dev' directory");
        try {
            await fs.rm(path.join("./dev"), { recursive: true });
            Logger.success("dev directory cleared");
        } catch (e) {
            Logger.error("Could not clear dev directory");
            throw e;
        }
    }
    if (await pathExists("./build")) {
        Logger.log("clearing build directory");
        try {
            await fs.rm(path.join("./build"), { recursive: true });
            Logger.success("build directory cleared");
        } catch (e) {
            Logger.error("Could not clear build directory");
            throw e;
        }
    }
};
