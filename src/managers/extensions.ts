import { Logger } from "@tryforge/forgescript";
import { ForgePanel } from "./server-bridge";
import { ConfigSchema } from "../config";

export class ExtensionsManager {
    constructor(config: ConfigSchema["bot"]){
        Logger.info("Server marked as online.");
        const ext = [new ForgePanel(config)];
        return ext;
    };
};