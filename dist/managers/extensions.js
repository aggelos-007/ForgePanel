"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionsManager = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const server_bridge_1 = require("./server-bridge");
class ExtensionsManager {
    constructor(config) {
        forgescript_1.Logger.info("Server marked as online.");
        const ext = [new server_bridge_1.ForgePanel(config)];
        if (config.extensions.includes("ForgeDB")) {
            const { ForgeDB } = require("@tryforge/forge.db");
            ext.push(new ForgeDB({ type: "better-sqlite3" }));
        }
        if (config.extensions.includes("ForgeCanvas")) {
            const { ForgeCanvas } = require("@tryforge/forge.canvas");
            ext.push(new ForgeCanvas());
        }
        return ext;
    }
    ;
}
exports.ExtensionsManager = ExtensionsManager;
;
