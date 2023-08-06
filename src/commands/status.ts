import { assertSetup, loadConfig } from "../common";

export const runStatus = async () => {
    await assertSetup();
    const config = await loadConfig();
    console.log(config);
};
