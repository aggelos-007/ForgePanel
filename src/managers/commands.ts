import { IApplicationCommandData, IBaseCommand } from "@tryforge/forgescript";
import { config } from "../config";
import { basename, dirname, join } from "path";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "fs";
import { InstanceManager } from "./instances";
import { ProcessCodes } from "./server-bridge";
import { emitter, OpCodes } from "./events";

export class CommandManager {
    static commandsPath: (string | undefined)[] = [];
    static commandsMap = new Map<string, IBaseCommand<string>>();
    static slashesPath: (string | undefined)[] = [];
    static slashesMap = new Map<string, IApplicationCommandData>();

    static dir: string;
    constructor(dir: string){
        dir = dirname(dir)
        CommandManager.dir = dir;
        this.#load(dir);
    };

    async #load(path: string){
        await Promise.all([
            this.#loader(join(path, config.commands.base), "commands"),
            this.#loader(join(path, config.commands.slashes), "slashes")
        ])
    };

    async #loader(path: string, type: "slashes" | "commands"){
        if(!existsSync(path)) return;
        const Map = CommandManager[`${type}Map`],
        arr = CommandManager[`${type}Path`],
        no_id: string[] = []

        async function load(dir = path){
            const files = readdirSync(dir);
            for(let file of files){
                const path = join(dir, file)
                if(statSync(path).isDirectory()) load(path);
                else {
                    const split = file.split("_");
                    if(split.length > 1 && !isNaN(Number(split[0]))){
                        const data = require(path);
                        Map.set(path, data.default ?? data);
                        arr[Number(split[0])] = path;
                        delete require.cache[require.resolve(path)];
                    } else no_id.push(path);
                }
            }
        }
        await load()
        for(const file of no_id){
            const dir = dirname(file), oldName = basename(file);
            let id = arr.findIndex(s => s === undefined);
            if(id == -1) id = arr.length;
            const name = `${id}_${oldName}`;
            const path = join(dir, name);
            renameSync(join(dir, oldName), path);
            const data = require(path);
            Map.set(path, data.default ?? data);
            arr[id] = path;
            delete require.cache[require.resolve(path)];
        };
    };

    static deleteCommand(id: number, type: "commands" | "slashes"){
        const path = this[`${type}Path`][id]
        if(!path) return null;
        try {
            unlinkSync(path);
            this[`${type}Map`].delete(path);
            this.commandsPath[id] = undefined;
            InstanceManager.sendMessage({ code: ProcessCodes.UpdateCommands })
            emitter.emit("websocket", { op: OpCodes.DeleteCommand, data: { id, type } })
            return true
        } catch(_) {
            return false
        }
    };

    static createCommand(filename: string, data: ({ commandData: IBaseCommand<string>, type: "commands" } | { commandData: IApplicationCommandData, type: "slashes" })): number | null {
        const { commandData, type } = data;
        const arr = this.commandsPath;
        let id = arr.findIndex(v => v === undefined);
        if (id === -1) id = arr.length;
        const file = `${id}_${basename(filename)}`;
        const path = join(this.dir, type == "commands" ? config.commands.base : config.commands.slashes, dirname(filename), file);
        let folder = dirname(path);
        if(!existsSync(folder)) mkdirSync(folder, { recursive: true });
        try {
            const content = typeof commandData === 'string' ? commandData : `module.exports = ${JSON.stringify(commandData, null, 2)};`;
            writeFileSync(path, content, { encoding: 'utf-8' });
            const data = require(path);
            this.commandsMap.set(path, data.default ?? data);
            arr[id] = path;
            delete require.cache[require.resolve(path)];
            InstanceManager.sendMessage({ code: ProcessCodes.UpdateCommands })
            emitter.emit("websocket", { op: OpCodes.CreateCommand, data: { id, type, commandData } })
            return id;
        } catch (e) {
            return null;
        }
    };

    static editCommand(id: number, data: ({ commandData: IBaseCommand<string>; type: "commands" } | { commandData: IApplicationCommandData; type: "slashes" })): number | null {
        const { commandData, type } = data;
        const arr = this[`${type}Path`];
        const path = arr[id];
        if (!path) return null;
        try {
            const content = typeof commandData === 'string' ? commandData : `module.exports = ${JSON.stringify(commandData, null, 2)};`;
            writeFileSync(path, content, { encoding: 'utf-8' });
            const data = require(path);
            emitter.emit("websocket", { op: OpCodes.EditCommand, data: { id, type, newCommandData: data.default ?? data, oldCommandData: this[`${type}Map`].get(path) as any } })
            this[`${type}Map`].set(path, data.default ?? data);
            delete require.cache[require.resolve(path)];
            InstanceManager.sendMessage({ code: ProcessCodes.UpdateCommands })
            return id;
        } catch (e) {
            return null;
        }
    };

    static disableCommand(id: number, type: "commands" | "slashes"){
        const arr = this[`${type}Path`];
        const path = arr[id];
        const map = this[`${type}Map`];
        if (!path || path.endsWith(".disabled")) return null;
        try {
            arr[id] = path + ".disabled";
            map.set(path + ".disabled", map.get(path) as any);
            map.delete(path);
            InstanceManager.sendMessage({ code: ProcessCodes.UpdateCommands })
            emitter.emit("websocket", { op: OpCodes.DisableCommand, data: { id, type } })
            renameSync(path, path + ".disabled");
            return true;
        } catch (e) {
            return false;
        }
    };

    static enableCommand(id: number, type: "commands" | "slashes"){
        const arr = this[`${type}Path`];
        const path = arr[id];
        const map = this[`${type}Map`];
        if (!path || !path.endsWith(".disabled")) return null;
        try {
            arr[id] = path.replace(".disabled", "");
            map.set(path.replace(".disabled", ""), map.get(path) as any);
            map.delete(path);
            InstanceManager.sendMessage({ code: ProcessCodes.UpdateCommands })
            emitter.emit("websocket", { op: OpCodes.EnableCommand, data: { id, type } })
            renameSync(path, path.replace(".disabled", ""));
            return true;
        } catch (e) {
            return false;
        }
    }

    static moveCommand(data: { id: number; path: string; type: "commands" | "slashes" }){
        const { id, type } = data;
        const arr = this[`${type}Path`];
        const path = arr[id];
        if(!path) return null;
        try {
            const name = basename(path);
            const newPath = join(this.dir, config.commands[type == "commands" ? "base" : "slashes"], data.path, name);
            const check = dirname(newPath)
            if(!existsSync(check)) mkdirSync(check, { recursive: true });
            renameSync(path, newPath);
            this[`${type}Map`].set(newPath, this[`${type}Map`].get(path) as any);
            this[`${type}Map`].delete(path);
            arr[id] = newPath;
            emitter.emit("websocket", { op: OpCodes.MoveCommand, data: { id, type,
                oldPath: dirname(path).replace(join(this.dir, config.commands[type == "commands" ? "base" : "slashes"]), ""),
                newPath: dirname(newPath).replace(join(this.dir, config.commands[type == "commands" ? "base" : "slashes"]), "") } })
            return true;
        } catch (e) {
            return false;
        }
    }
};