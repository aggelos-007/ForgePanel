import { Logger } from "@tryforge/forgescript";
import { ForgePanel } from "./server-bridge";
import { ConfigSchema } from "../config";

export class ExtensionsManager {
    constructor(config: ConfigSchema["bot"]){
        Logger.info("Server marked as online.");
        const ext = [new ForgePanel(config)];
        if(config.extensions.includes("ForgeDB")) {
            const { ForgeDB } = require("@tryforge/forge.db")
            ext.push(new ForgeDB())
        }
        if(config.extensions.includes("ForgeCanvas")) {
            const { ForgeCanvas } = require("@tryforge/forge.canvas")
            ext.push(new ForgeCanvas())
        }
        return ext;
    };
};