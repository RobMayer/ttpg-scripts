import * as path from "path";
import * as fs from "fs/promises";
import { assertSetup, pathExists, Logger, ASSET_DIRS, loadConfig, spawnBuilder, spawnTranspiler } from "../common";

export const runDev = async () => {
    await assertSetup();

    const config = await loadConfig();

    if (!(await pathExists(path.resolve("./dev/", `${config.project.slug}_dev`)))) {
        try {
            const manifest = {
                Name: `${config.project.name} (Dev)`,
                Version: config.project.version,
                GUID: config.project.guid.dev,
            };

            await fs.mkdir(path.resolve("./dev", `${config.project.slug}_dev`), { recursive: true });
            await fs.writeFile(path.resolve("./dev/", `${config.project.slug}_dev`, "Manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
            await Promise.all(ASSET_DIRS.map((dir) => fs.symlink(path.resolve("assets", dir), path.resolve("dev", `${config.project.slug}_dev`, dir), "junction")));

            Logger.log("Copying Thumbnail");
            try {
                if (await pathExists(path.resolve("./Thumbnail.png"))) {
                    await fs.copyFile(path.resolve("./Thumbnail.png"), path.resolve(config.local.ttpg_path, `${config.project.slug}`, "Thumbnail.png"));
                }
                Logger.success("thumbnail copied");
            } catch (e) {
                Logger.error("Could not copy thumbnail");
                throw e;
            }
        } catch (e) {
            Logger.error("Failed to create dev folder");
            throw e;
        }
    }

    if (!(await pathExists(path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}_dev`)))) {
        Logger.notice("symlinking ./dev folder into ttpg");
        try {
            await fs.symlink(path.resolve("./dev", `${config.project.slug}_dev`), path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}_dev`), "junction");
        } catch (e) {
            Logger.error("Could not symlink dev folder to ttpg folder");
            throw e;
        }
    }
    if (config.project.transpile || config.project.template === "typescript") {
        Logger.notice("Transpiling typescript");
        try {
            await spawnTranspiler(`./dev/${config.project.slug}_dev/Scripts/`);
            Logger.success("Transpile Complete");
        } catch (e) {
            Logger.error("Could not transpile");
            throw e;
        }
    } else {
        Logger.notice("Copying javascript");
        try {
            await fs.cp("./src", `./dev/${config.project.slug}_dev/Scripts/`, { recursive: true });
            Logger.success("Copy Complete");
        } catch (e) {
            Logger.error("Could not copy scripts");
            throw e;
        }
    }
    Logger.log("building dependencies");
    try {
        await spawnBuilder(`./dev/${config.project.slug}_dev/Scripts/node_modules`);
    } catch (e) {
        Logger.error("Could not build dependencies");
        throw e;
    }
};
