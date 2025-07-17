"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceManager = void 0;
const path_1 = require("path");
const pidusage_1 = __importDefault(require("pidusage"));
const panel_1 = require("./panel");
const config_1 = require("../config");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const events_1 = require("./events");
const server_bridge_1 = require("./server-bridge");
class InstanceManager {
    static child = false;
    static #path;
    static #interval = null;
    static logStream;
    constructor(path) {
        InstanceManager.#path = path;
    }
    ;
    static async start() {
        this.logStream = (0, fs_1.createWriteStream)((0, path_1.join)(config_1.config.dir, 'console.log'), { flags: 'w' });
        this.child = await (0, child_process_1.fork)(this.#path, [], {
            stdio: ['inherit', 'pipe', 'pipe', 'ipc']
        });
        this.#started();
        this.child.stdout?.on('data', this.#handleLogs.bind(this));
        this.child.stderr?.on('data', this.#handleLogs.bind(this));
        this.child.on("message", this.messageReceived.bind(this));
        this.child.once("exit", this.#onExit.bind(this));
    }
    static #handleLogs(data) {
        this.logStream.write(data);
        events_1.emitter.emit("websocket", {
            op: events_1.OpCodes.Console,
            data: String(data)
        });
    }
    static #onExit() {
        if (this.logStream)
            this.logStream.end().close();
        if (this.#interval)
            clearInterval(this.#interval);
        if (!this.child)
            return;
        this.child.stdout?.off('data', this.#handleLogs.bind(this));
        this.child.stderr?.off('data', this.#handleLogs.bind(this));
        this.child.off("message", this.messageReceived.bind(this));
        this.child = false;
    }
    static #started() {
        panel_1.Panel.updateConfig({ panel: { status: "running" } });
        this.#interval = setInterval(async () => {
            if (!this.child || !this.child.pid)
                return;
            const usage = await (0, pidusage_1.default)(this.child.pid).catch(() => null);
            if (!usage) {
                if (this.#interval)
                    clearInterval(this.#interval);
                return;
            }
            ;
            events_1.emitter.emit("websocket", {
                op: events_1.OpCodes.Usage,
                data: {
                    cpu: Number((usage.cpu).toFixed(2)),
                    ram: Number(((usage.memory) / 1024 / 1024).toFixed(2))
                }
            });
        }, 1_000);
    }
    static async stop() {
        if (!this.child)
            return;
        if (this.#interval)
            clearInterval(this.#interval);
        const child = this.child;
        this.child = false;
        this.#interval = null;
        return await new Promise((resolve) => {
            child.once("exit", resolve);
            child.kill();
            panel_1.Panel.updateConfig({ panel: { status: "stopped" } });
        });
    }
    ;
    static async restart() {
        await this.stop();
        return await this.start();
    }
    ;
    static #pendingReplies = new Map();
    static async messageReceived(msg) {
        if (!this.child)
            return false;
        switch (msg.type) {
            case server_bridge_1.SendType.Reply:
                if (msg.id && this.#pendingReplies.has(msg.id)) {
                    const resolve = this.#pendingReplies.get(msg.id);
                    this.#pendingReplies.delete(msg.id);
                    const { ["id"]: _, ...rest } = msg;
                    resolve?.(rest);
                }
                ;
                break;
            case server_bridge_1.SendType.Information:
                if (msg.code == server_bridge_1.ProcessCodes.WebSocketInfo) {
                    events_1.emitter.emit("websocket", msg.data);
                }
                ;
                break;
            case server_bridge_1.SendType.RequestReply:
                break;
        }
    }
    static askChild(data) {
        data.type = server_bridge_1.SendType.RequestReply;
        data.id = (0, crypto_1.randomUUID)();
        return new Promise(resolve => {
            if (!this.child)
                return resolve(false);
            const timeout = setTimeout(() => {
                resolve(null);
                this.#pendingReplies.delete(data.id);
            }, 5_000);
            const r = (data) => { clearTimeout(timeout); resolve(data); };
            this.#pendingReplies.set(data.id, r);
            this.child.send(data);
        });
    }
    ;
    static async sendMessage(msg) {
        if (!this.child)
            return null;
        msg.type = server_bridge_1.SendType.Information;
        return this.child.send(msg);
    }
    ;
}
exports.InstanceManager = InstanceManager;
;
