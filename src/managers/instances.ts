import { join } from "path";
import pidusage from "pidusage";
import { Panel } from "./panel";
import { config } from "../config";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { ChildProcess, fork } from "child_process";
import { emitter, OpCodes, PowerAction } from "./events";
import { ProcessCodes, ProcessMessage, ProcessMessages, SendType } from "./server-bridge";

export class InstanceManager {
    static child: ChildProcess | false = false;
    static #path: string;
    static #interval: ReturnType<typeof setInterval> | null = null;
    private static logStream: ReturnType<typeof createWriteStream>

    constructor(path: string){
        InstanceManager.#path = path;
    };

    static async start(){
        this.logStream = createWriteStream(join(config.dir, 'console.log'), { flags: 'w' });
        this.child = await fork(this.#path, [], {
            stdio: ['inherit', 'pipe', 'pipe', 'ipc']
        });

        this.#started()

        this.child.stdout?.on('data', this.#handleLogs.bind(this));
        this.child.stderr?.on('data', this.#handleLogs.bind(this));
        this.child.on("message", this.messageReceived.bind(this));
        this.child.once("exit", this.#onExit.bind(this));
    }

    static #handleLogs(data: any){
        console.log(String(data).trim())
        this.logStream.write(data);
        emitter.emit("websocket", {
            op: OpCodes.Console,
            data: String(data)
        });
    }

    static #onExit(){
        if(this.logStream) this.logStream.end().close();
        if(this.#interval) clearInterval(this.#interval);
        if(!this.child) return;
        this.child.stdout?.off('data', this.#handleLogs.bind(this));
        this.child.stderr?.off('data', this.#handleLogs.bind(this));
        this.child.off("message", this.messageReceived.bind(this));
        this.child = false;
    }

    static #started(){
        Panel.updateConfig({panel: {status: "running"}});
        this.#interval = setInterval(async () => {
            if(!this.child || !this.child.pid) return;
            const usage = await pidusage(this.child.pid).catch(()=>null);
            if(!usage){
                if(this.#interval) clearInterval(this.#interval);
                return;
            };
            emitter.emit("websocket", {
                op: OpCodes.Usage,
                data: {
                    cpu: Number((usage.cpu).toFixed(2)),
                    ram: Number(((usage.memory) / 1024 / 1024).toFixed(2))
                }
            });
        }, 1_000);
        emitter.emit("websocket", {
            op: OpCodes.Power,
            data: {
                action: PowerAction.Start
            }
        });
    }

    static async stop(){
        if(!this.child) return;
        if(this.#interval) clearInterval(this.#interval);
        const child = this.child;
        this.child = false;
        this.#interval = null;

        emitter.emit("websocket", {
            op: OpCodes.Power,
            data: {
                action: PowerAction.Stop
            }
        });

        return await new Promise<void>((resolve) => {
            child.once("exit", resolve);
            child.kill();
            Panel.updateConfig({panel: {status: "stopped"}});
        });
    };

    static async restart(){
        await this.stop();
        return await this.start();
    };

    static #pendingReplies = new Map<string, (data: any) => void>();

    static async messageReceived(msg: ProcessMessage){
        if(!this.child) return false;
                switch(msg.type){
            case SendType.Reply:
                if(msg.id && this.#pendingReplies.has(msg.id)){
                    const resolve = this.#pendingReplies.get(msg.id);
                    this.#pendingReplies.delete(msg.id);
                    const { ["id"]: _, ...rest } = msg;
                    resolve?.(rest);
                };
            break;
            case SendType.Information:
                if(msg.code == ProcessCodes.WebSocketInfo){
                    emitter.emit("websocket", msg.data);
                };
            break;
            case SendType.RequestReply:

            break;
        }
    }

    static askChild<T extends ProcessCodes>(data: Partial<ProcessMessages<SendType, T>>){
        data.type = SendType.RequestReply;
        data.id = randomUUID();
        return new Promise<Partial<ProcessMessages<SendType, T>>| false | null>(resolve => {
            if(!this.child) return resolve(false);
            const timeout = setTimeout(()=>{
                resolve(null);
                this.#pendingReplies.delete(data.id!);
            }, 5_000);
            const r = (data: ProcessMessages<SendType.Reply, T>) => {clearTimeout(timeout); resolve(data)};
            this.#pendingReplies.set(data.id!, r)
            this.child.send(data);
        });
    };

    static async sendMessage<T extends ProcessCodes>(msg: Partial<ProcessMessages<SendType, T>>){
        if(!this.child) return null;
        msg.type = SendType.Information;
        return this.child.send(msg);
    };
};