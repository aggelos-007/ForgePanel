"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandManager = void 0;
const config_1 = require("../config");
const path_1 = require("path");
const fs_1 = require("fs");
const instances_1 = require("./instances");
const server_bridge_1 = require("./server-bridge");
const events_1 = require("./events");
class CommandManager {
    static commandsPath = [];
    static commandsMap = new Map();
    static slashesPath = [];
    static slashesMap = new Map();
    static dir;
    constructor(dir) {
        dir = (0, path_1.dirname)(dir);
        _a.dir = dir;
        this.#load(dir);
    }
    ;
    async #load(path) {
        await Promise.all([
            this.#loader((0, path_1.join)(path, config_1.config.commands.base), "commands"),
            this.#loader((0, path_1.join)(path, config_1.config.commands.slashes), "slashes")
        ]);
    }
    ;
    async #loader(path, type) {
        if (!(0, fs_1.existsSync)(path))
            return;
        const Map = _a[`${type}Map`], arr = _a[`${type}Path`], no_id = [];
        async function load(dir = path) {
            const files = (0, fs_1.readdirSync)(dir);
            for (let file of files) {
                const path = (0, path_1.join)(dir, file);
                if ((0, fs_1.statSync)(path).isDirectory())
                    load(path);
                else {
                    const split = file.split("_");
                    if (split.length > 1 && !isNaN(Number(split[0]))) {
                        const data = require(path);
                        Map.set(path, data.default ?? data);
                        arr[Number(split[0])] = path;
                        delete require.cache[require.resolve(path)];
                    }
                    else
                        no_id.push(path);
                }
            }
        }
        await load();
        for (const file of no_id) {
            const dir = (0, path_1.dirname)(file), oldName = (0, path_1.basename)(file);
            let id = arr.findIndex(s => s === undefined);
            if (id == -1)
                id = arr.length;
            const name = `${id}_${oldName}`;
            const path = (0, path_1.join)(dir, name);
            (0, fs_1.renameSync)((0, path_1.join)(dir, oldName), path);
            const data = require(path);
            Map.set(path, data.default ?? data);
            arr[id] = path;
            delete require.cache[require.resolve(path)];
        }
        ;
    }
    ;
    static deleteCommand(id, type) {
        const path = this[`${type}Path`][id];
        if (!path)
            return null;
        try {
            (0, fs_1.unlinkSync)(path);
            this[`${type}Map`].delete(path);
            this.commandsPath[id] = undefined;
            instances_1.InstanceManager.sendMessage({ code: server_bridge_1.ProcessCodes.UpdateCommands });
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.DeleteCommand, data: { id, type } });
            return true;
        }
        catch (_) {
            return false;
        }
    }
    ;
    static createCommand(filename, data) {
        const { commandData, type } = data;
        const arr = this.commandsPath;
        let id = arr.findIndex(v => v === undefined);
        if (id === -1)
            id = arr.length;
        const file = `${id}_${(0, path_1.basename)(filename)}`;
        const path = (0, path_1.join)(this.dir, type == "commands" ? config_1.config.commands.base : config_1.config.commands.slashes, (0, path_1.dirname)(filename), file);
        let folder = (0, path_1.dirname)(path);
        if (!(0, fs_1.existsSync)(folder))
            (0, fs_1.mkdirSync)(folder, { recursive: true });
        try {
            const content = typeof commandData === 'string' ? commandData : `module.exports = ${JSON.stringify(commandData, null, 2)};`;
            (0, fs_1.writeFileSync)(path, content, { encoding: 'utf-8' });
            const data = require(path);
            this.commandsMap.set(path, data.default ?? data);
            arr[id] = path;
            delete require.cache[require.resolve(path)];
            instances_1.InstanceManager.sendMessage({ code: server_bridge_1.ProcessCodes.UpdateCommands });
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.CreateCommand, data: { id, type, commandData } });
            return id;
        }
        catch (e) {
            return null;
        }
    }
    ;
    static editCommand(id, data) {
        const { commandData, type } = data;
        const arr = this[`${type}Path`];
        const path = arr[id];
        if (!path)
            return null;
        try {
            const content = typeof commandData === 'string' ? commandData : `module.exports = ${JSON.stringify(commandData, null, 2)};`;
            (0, fs_1.writeFileSync)(path, content, { encoding: 'utf-8' });
            const data = require(path);
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.EditCommand, data: { id, type, newCommandData: data.default ?? data, oldCommandData: this[`${type}Map`].get(path) } });
            this[`${type}Map`].set(path, data.default ?? data);
            delete require.cache[require.resolve(path)];
            instances_1.InstanceManager.sendMessage({ code: server_bridge_1.ProcessCodes.UpdateCommands });
            return id;
        }
        catch (e) {
            return null;
        }
    }
    ;
    static disableCommand(id, type) {
        const arr = this[`${type}Path`];
        const path = arr[id];
        const map = this[`${type}Map`];
        if (!path || path.endsWith(".disabled"))
            return null;
        try {
            arr[id] = path + ".disabled";
            map.set(path + ".disabled", map.get(path));
            map.delete(path);
            instances_1.InstanceManager.sendMessage({ code: server_bridge_1.ProcessCodes.UpdateCommands });
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.DisableCommand, data: { id, type } });
            (0, fs_1.renameSync)(path, path + ".disabled");
            return true;
        }
        catch (e) {
            return false;
        }
    }
    ;
    static enableCommand(id, type) {
        const arr = this[`${type}Path`];
        const path = arr[id];
        const map = this[`${type}Map`];
        if (!path || !path.endsWith(".disabled"))
            return null;
        try {
            arr[id] = path.replace(".disabled", "");
            map.set(path.replace(".disabled", ""), map.get(path));
            map.delete(path);
            instances_1.InstanceManager.sendMessage({ code: server_bridge_1.ProcessCodes.UpdateCommands });
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.EnableCommand, data: { id, type } });
            (0, fs_1.renameSync)(path, path.replace(".disabled", ""));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static moveCommand(data) {
        const { id, type } = data;
        const arr = this[`${type}Path`];
        const path = arr[id];
        if (!path)
            return null;
        try {
            const name = (0, path_1.basename)(path);
            const newPath = (0, path_1.join)(this.dir, config_1.config.commands[type == "commands" ? "base" : "slashes"], data.path, name);
            const check = (0, path_1.dirname)(newPath);
            if (!(0, fs_1.existsSync)(check))
                (0, fs_1.mkdirSync)(check, { recursive: true });
            (0, fs_1.renameSync)(path, newPath);
            this[`${type}Map`].set(newPath, this[`${type}Map`].get(path));
            this[`${type}Map`].delete(path);
            arr[id] = newPath;
            events_1.emitter.emit("websocket", { op: events_1.OpCodes.MoveCommand, data: { id, type,
                    oldPath: (0, path_1.dirname)(path).replace((0, path_1.join)(this.dir, config_1.config.commands[type == "commands" ? "base" : "slashes"]), ""),
                    newPath: (0, path_1.dirname)(newPath).replace((0, path_1.join)(this.dir, config_1.config.commands[type == "commands" ? "base" : "slashes"]), "") } });
            return true;
        }
        catch (e) {
            return false;
        }
    }
}
exports.CommandManager = CommandManager;
_a = CommandManager;
;
