import * as path from "path";
import * as fs from "fs/promises";
import * as readline from "readline/promises";
import * as chalk from "colorette";
import { v4 as uuid } from "uuid";
import { spawn } from "cross-spawn";

export const ASSET_DIRS = ["Fonts", "Models", "Sounds", "States", "Templates", "Textures", "Thumbnails"] as const;

export const pathExists = async (p: string) => {
    const thePath = path.resolve(p);
    try {
        await fs.access(thePath);
        return true;
    } catch {
        return false;
    }
};

export type Config = {
    project: {
        name: string;
        slug: string;
        version: string;
        transpile: boolean;
        template?: "javascript" | "typescript";
        guid: {
            dev: string;
            prd: string;
        };
    };
    local: {
        ttpg_path: string;
    };
};

const getSuggestedTTPGPath = async (): Promise<string | null> => {
    if (process.platform === "darwin") {
        if (await pathExists(process.env.HOME + "/Library/Application Support/Epic/TabletopPlayground/Package")) {
            return path.resolve(process.env.HOME + "/Library/Application Support/Epic/TabletopPlayground/Package");
        }
    } else if (process.platform === "win32") {
        // steam
        if (await pathExists("C:\\Program Files (x86)\\Steam\\steamapps\\common\\TabletopPlayground\\TabletopPlayground\\PersistentDownloadDir")) {
            return path.resolve("C:\\Program Files (x86)\\Steam\\steamapps\\common\\TabletopPlayground\\TabletopPlayground\\PersistentDownloadDir");
        }
        //epic
        if (await pathExists("C:\\Program Files\\Epic Games\\TabletopPlayground\\TabletopPlayground\\PersistentDownloadDir")) {
            return path.resolve("C:\\Program Files\\Epic Games\\TabletopPlayground\\TabletopPlayground\\PersistentDownloadDir");
        }
        // microsoft store
        if (await pathExists(process.env.HOME + "\\TabletopPlayground\\Packages")) {
            return path.resolve(process.env.HOME + "\\TabletopPlayground\\Packages");
        }
    }
    return null;
};

export const ensureLocalConfig = async () => {
    if (!(await pathExists("./ttpgcfg.local.json"))) {
        const input = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const suggestedTTPGPath = await getSuggestedTTPGPath();
        const input_ttpg_path = (
            await input.question(chalk.whiteBright(`path to TTPG Package or PersistentDownloadDir directory ${suggestedTTPGPath ? `[${chalk.white(suggestedTTPGPath)}]: ` : ": "}`))
        ).trim();
        const ttpg_path = input_ttpg_path !== "" ? input_ttpg_path : suggestedTTPGPath;
        if (ttpg_path) {
            await fs.writeFile(
                path.resolve("./ttpgcfg.local.json"),
                JSON.stringify(
                    {
                        ttpg_path,
                    },
                    null,
                    2
                ),
                "utf-8"
            );
            input.close();
        } else {
            input.close();
            throw Error("ttpg_path is required");
        }
    }
};

export const ensureProjectConfig = async () => {
    if (!(await pathExists("./ttpgcfg.project.json"))) {
        const input = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const projectTitle = await input.question(chalk.whiteBright("What is your packages title?"));
        if (projectTitle) {
            const suggestedSlug = projectTitle.toLowerCase().replace(/\W/g, "-");
            const projectSlug = await input.question(chalk.whiteBright(`Provide a 'slug' identifier for your project [${chalk.white(suggestedSlug)}]: `));
            const suggestedPrdGuid = guid();
            const inputPrdGuid = (
                await input.question(chalk.whiteBright(`Provide a production GUID for your package (or 'enter' to use the provided value) [${chalk.white(suggestedPrdGuid)}]: `))
            ).trim();
            const prdGuid = inputPrdGuid !== "" ? inputPrdGuid : suggestedPrdGuid;
            const suggstedDevGuid = guid();
            const inputDevGuid = (
                await input.question(chalk.whiteBright(`Provide a development GUID for your package (or 'enter' to use the provided value) [${chalk.white(suggstedDevGuid)}]: `))
            ).trim();
            const devGuid = inputDevGuid !== "" ? inputDevGuid : suggstedDevGuid;

            const suggestedVersion = JSON.parse(await fs.readFile(path.resolve("./", "package.json"), "utf8"))?.version ?? "0.0.1";
            const inputVersion = (await input.question(chalk.whiteBright(`Provide a version number [${chalk.white(suggestedVersion)}]: `))).trim();
            const projectVersion = inputVersion !== "" ? inputVersion : suggestedVersion;

            const suggestedTemplate = "typescript";
            const inputTemplate = (await input.question(chalk.whiteBright(`Are you using Typescript or Javascript?: [${chalk.white(suggestedTemplate)}]: `))).trim().toLowerCase();
            const projectTemplate = inputTemplate === "typescript" || inputTemplate === "javascript" ? inputTemplate : suggestedTemplate;

            await fs.writeFile(
                path.resolve("./ttpgcfg.project.json"),
                JSON.stringify(
                    {
                        name: projectTitle,
                        slug: projectSlug,
                        template: projectTemplate,
                        version: projectVersion,
                        guid: {
                            dev: devGuid,
                            prd: prdGuid,
                        },
                    },
                    null,
                    2
                )
            );
            input.close();
        } else {
            input.close();
            throw Error("Project Title is Required");
        }
    }
};

export const assertSetup = async (): Promise<void> => {
    if (!(await pathExists("./ttpgcfg.local.json"))) {
        Logger.error("workspace is not set up, run 'yarn setup'");
        throw Error("Not set up");
    }
};

export const loadConfig = async (): Promise<Config> => {
    const local: Config["local"] = JSON.parse(await fs.readFile(path.resolve("./ttpgcfg.local.json"), "utf8"));
    let project: Config["project"] = JSON.parse(await fs.readFile(path.resolve("./ttpgcfg.project.json"), "utf8"));

    if (project.template && !("transpiler" in project)) {
        project.transpile = project.template === "typescript";
        const { template, ...newProject } = project;
        project = newProject;
        await fs.writeFile(path.resolve("./ttpgcfg.project.json"), JSON.stringify(project), "utf-8");
    }

    return {
        local,
        project,
    };
};

export const Logger = {
    log: (...messages: string[]) => console.log(chalk.white(messages.join(" "))),
    notice: (...messages: string[]) => console.log(chalk.blueBright(messages.join(" "))),
    error: (...messages: string[]) => console.error(chalk.redBright(messages.join(" "))),
    success: (...messages: string[]) => console.error(chalk.greenBright(messages.join(" "))),
    warning: (...messages: string[]) => console.error(chalk.yellowBright(messages.join(" "))),
    welcome: () => console.log(chalk.cyanBright(chalk.underline("Good Morning, Captain!"))),
    complete: () => console.log(chalk.cyanBright(chalk.underline("Good Hunting!"))),
};

export const guid = () => uuid().replace(/-/g, "").toUpperCase();

export const spawnBuilder = (target: string) => {
    return new Promise((resolve, reject) => {
        const child = spawn("yarn", ["install", "--modules-folder", target, "--prod"], { stdio: "pipe", cwd: process.cwd() });
        child.on("close", (code: number) => (code === 0 ? resolve(0) : undefined));
        child.on("error", (e) => reject(e));
    });
};

export const spawnTranspiler = (target: string) => {
    return new Promise((resolve, reject) => {
        const child = spawn("tsc", ["--outDir", target], { stdio: "pipe", env: process.env });
        child.on("close", (code: number) => (code === 0 ? resolve(0) : undefined));
        child.on("error", (e) => reject(e));
    });
};
