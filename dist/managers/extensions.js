"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionsManager = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const server_bridge_1 = require("./server-bridge");
class ExtensionsManager {
    constructor(config) {
        forgescript_1.Logger.info("Server marked as online.");
        const ext = [new server_bridge_1.ForgePanel(config)];
        return ext;
    }
    ;
}
exports.ExtensionsManager = ExtensionsManager;
;
