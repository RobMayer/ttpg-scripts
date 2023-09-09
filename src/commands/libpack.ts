import * as path from "path";
import * as fs from "fs/promises";
import { Logger, assertSetup, loadConfig, pathExists, spawnBuilder, spawnLibBundler, spawnTranspiler } from "../common";
import * as glob from "fast-glob";

export const runLibpack = async () => {
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
        Logger.log("gathering utilized scripts from template folders");
        try {
            const templates = await glob.async("./assets/Templates/**/*.json");
            const scriptsToBundle = Object.keys(
                (await Promise.all(templates.map(async (f) => JSON.parse(await fs.readFile(f, "utf-8"))))).reduce<{ [key: string]: boolean }>((acc, each) => {
                    if (each.ScriptName) {
                        acc[each.ScriptName] = true;
                    }
                    return acc;
                }, {})
            );
            Logger.log("generating rollup config");
            try {
                await fs.writeFile(
                    "./rollup.config.js",

                    `module.exports = {
                        output: {
                            entryFileNames: "[name]",
                            dir: "lib",
                            format: "cjs",
                            exports: "named",
                            plugins: [require("@rollup/plugin-terser")()],
                        },
                        input: {${scriptsToBundle.reduce<string>((acc, fname) => {
                            return `${acc}'${fname}': "./build/${fname}",`;
                        }, "")}},
                        plugins: [require("@rollup/plugin-node-resolve").nodeResolve(), require("@rollup/plugin-commonjs")()],
                        external: ['@tabletop-playground/api']
                    }`,
                    "utf8"
                );
            } catch (e) {
                Logger.error("could not generate rollup config");
                throw e;
            }
        } catch (e) {
            Logger.error("could not glob files");
            throw e;
        }
        Logger.log("lib-packing");
        try {
            await spawnLibBundler();
            Logger.success("it should've built?");
        } catch (e) {
            Logger.error("could not lib-pack");
            throw e;
        }
        Logger.log("copying scripts to production directory");
        try {
            await fs.cp(path.resolve("./lib"), path.join(path.resolve(config.local.ttpg_path), `${config.project.slug}`, "Scripts"), { recursive: true, dereference: true });
            Logger.success("scripts copied to production directory");
        } catch (e) {
            Logger.error("Could not copy lib to production directory");
        }
        Logger.log("removing temporary build directory");
        try {
            await fs.rm(path.resolve("./build"), { recursive: true });
            Logger.success("temporary build directory removed");
        } catch (e) {
            Logger.error("Could not remove temporary build directory");
            throw e;
        }
        Logger.log("removing temporary lib directory");
        try {
            await fs.rm(path.resolve("./lib"), { recursive: true });
            Logger.success("temporary lib directory removed");
        } catch (e) {
            Logger.error("Could not remove temporary lib directory");
            throw e;
        }
        Logger.log("removing temporary rollup config");
        try {
            await fs.rm(path.resolve("./rollup.config.js"), { recursive: true });
            Logger.success("temporary rollup config removed");
        } catch (e) {
            Logger.error("Could not remove temporary rollup config");
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
