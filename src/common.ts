import path from "path";
import fs from "fs/promises";

export const pathExists = async (p: string) => {
    const thePath = path.resolve(p);
    try {
        await fs.access(thePath);
        return true;
    } catch {
        return false;
    }
}

export type Config = {
    project: {
        name: string;
        slug: string;
        version: string;
        guid: {
            dev: string;
            prd: string;
        }
    }
    local: {
        ttpg_path: string;
    }
}
