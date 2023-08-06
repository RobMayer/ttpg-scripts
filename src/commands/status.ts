import { ensureLocalConfig, loadConfig } from "../common";

export const runStatus = async () => {
    const config = await loadConfig();
    console.log(config);
};
