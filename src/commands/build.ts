import * as path from "path";
import * as fs from "fs/promises";
import { Logger, assertSetup, loadConfig, pathExists, spawnBuilder, spawnTranspiler } from "../common";

export const runBuild = async () => {
    await assertSetup();
    const config = await loadConfig();

    Logger.log("Creating production directory");
    if (await pathExists(path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}`))) {
        Logger.error("Production build already exists, run 'yarn purge' if you'd like to delete it.");
        throw Error("Production build already exists");
    } else {
        try {
            await fs.mkdir(path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}`), { recursive: true });
        } catch (e) {
            Logger.error("Could not create production directory");
            throw e;
        }
        Logger.log("copying assets...");
        try {
            await fs.cp(path.resolve("./assets"), path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}`), { recursive: true, dereference: true });
        } catch (e) {
            Logger.error("Could not copy assets");
            throw e;
        }
        Logger.log("creating temporary build directory");
        try {
            await fs.mkdir(path.resolve("./build"), { recursive: true });
            Logger.success("build directory created");
        } catch (e) {
            Logger.error("Could not create build directory");
            throw e;
        }
        if (config.project.transpile || config.project.template === "typescript") {
            Logger.notice("Transpiling typescript");
            try {
                await spawnTranspiler(`./build/`);
                Logger.success("Transpile Complete");
            } catch (e) {
                Logger.error("Could not transpile");
                throw e;
            }
        } else {
            Logger.notice("Copying javascript");
            try {
                await fs.cp("./src", `./build/`, { recursive: true, dereference: true });
                Logger.success("Copy Complete");
            } catch (e) {
                Logger.error("Could not copy scripts");
                throw e;
            }
        }
        Logger.log("building dependencies");
        try {
            await spawnBuilder(`./build/node_modules`);
        } catch (e) {
            Logger.error("Could not build dependencies");
            throw e;
        }
        Logger.log("copying scripts to production directory");
        try {
            await fs.cp(path.resolve("./build"), path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}`, "Scripts"), { recursive: true, dereference: true });
            Logger.success("scripts copied to production directory");
        } catch (e) {
            Logger.error("Could not copy build to production directory");
        }
        Logger.log("removing temporary build directory");
        try {
            await fs.rm(path.resolve("./build"), { recursive: true });
            Logger.success("temporary build directory removed");
        } catch (e) {
            Logger.error("Could not remove temporary build directory");
            throw e;
        }
        const manifest = {
            Name: config.project.name,
            Version: config.project.version,
            GUID: config.project.guid.prd,
            ModID: config.project.modId,
        };
        Logger.log("writing production manifest");
        try {
            await fs.writeFile(path.resolve(config.local.ttpg_path, `${config.project.slug}`, "Manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
            Logger.success("manifest written");
        } catch (e) {
            Logger.error("Could not write production manifest");
            throw e;
        }
        Logger.success("Your project is ready to be deployed to mod.io");
    }
};
