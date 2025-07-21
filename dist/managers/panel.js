"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Panel = void 0;
const path_1 = require("path");
const _1 = require(".");
const config_1 = require("../config");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const api_1 = require("../api");
const commands_1 = require("./commands");
class Panel {
    dir;
    static dir = require.main?.filename;
    static port;
    static webserver;
    static config = config_1.ConfigDefaultSchema;
    constructor(port) {
        const dir = Panel.dir;
        if (!dir)
            throw new Error("Could not resolve main directory.");
        Panel.webserver = new api_1.WebServer();
        Panel.reloadRoutes();
        Panel.webserver.listen(port);
        Panel.dir = this.dir = (0, path_1.dirname)(dir);
        new _1.InstanceManager((0, path_1.join)(this.dir, config_1.config.bot));
        new commands_1.CommandManager(dir);
        this.create().then(async (start) => { if (start)
            _1.InstanceManager.start(); });
    }
    ;
    static async updateConfig(data) {
        if (!this.config)
            return;
        if (data.bot) {
            const { ["token"]: _, ...rest } = data.bot;
            _1.emitter.emit("websocket", {
                op: _1.OpCodes.ConfigUpdate,
                data: rest
            });
        }
        ;
        const config = this.#updateConfig(data, this.config);
        await this.#writeConfigFile(config);
        return this.config = config;
    }
    static async #writeConfigFile(data) {
        if (!this.dir)
            return;
        await (0, promises_1.writeFile)((0, path_1.join)(this.dir, config_1.config.dir, config_1.config.config), JSON.stringify(data));
    }
    static #updateConfig(data, config) {
        for (const key in data) {
            if (!data?.[key] || !config?.[key])
                continue;
            switch (typeof data[key]) {
                case "object":
                    config[key] = Array.isArray(data[key]) ? data[key] : this.#updateConfig(data[key], config[key]);
                    break;
                default:
                    config[key] = data[key];
                    break;
            }
            ;
        }
        ;
        return config;
    }
    async create() {
        return new Promise(async (resolve) => {
            const panelDir = (0, path_1.join)(this.dir, config_1.config.dir);
            (0, fs_1.mkdirSync)(panelDir, { recursive: true });
            const read = await (0, promises_1.readFile)((0, path_1.join)(panelDir, config_1.config.config), { encoding: "utf-8" }).catch(() => null);
            const [schema] = await Promise.all([
                Panel.updateConfig(read ? JSON.parse(read) : config_1.ConfigDefaultSchema) ?? config_1.ConfigDefaultSchema,
                (0, promises_1.writeFile)((0, path_1.join)(this.dir, config_1.config.bot), config_1.botFile)
            ]);
            return resolve(schema?.panel.status == "running");
        });
    }
    ;
    static reloadRoutes() {
        this.webserver.load();
    }
    ;
}
exports.Panel = Panel;
;
