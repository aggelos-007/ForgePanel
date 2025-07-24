import { dirname, join } from "path";
import { emitter, InstanceManager, OpCodes } from ".";
import { botFile, config, ConfigDefaultSchema, ConfigSchema } from "../config";
import { mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { WebServer } from "../api";
import { CommandManager } from "./commands";

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
        ? T[P]
        : DeepPartial<T[P]>
    : T[P];
};

export class Panel {
    private dir: string;
    public static dir = require.main?.filename;
    public static port: number;
    public static webserver: WebServer;
    static config: ConfigSchema = ConfigDefaultSchema;

    constructor(port: number){
        const dir = Panel.dir;
        if(!dir) throw new Error("Could not resolve main directory.");
        Panel.dir = this.dir = dirname(dir);
        
        Panel.webserver = new WebServer(join(this.dir, config.dir));
        Panel.reloadRoutes();
        Panel.webserver.listen(port);

        new InstanceManager(join(this.dir, config.bot));
        new CommandManager(dir)

        this.create().then(async start => { if(start) InstanceManager.start(); });
    };

    public static async updateConfig(data: DeepPartial<ConfigSchema>){
        if(!this.config) return;

        if(data.bot){
            const { ["token"]: _, ...rest } = data.bot;
            emitter.emit("websocket", {
                op: OpCodes.ConfigUpdate,
                data: rest
            });
        };

        const config = this.#updateConfig(data, this.config);
        await this.#writeConfigFile(config);
        return this.config = config;
    }

    static async #writeConfigFile(data: ConfigSchema){
        if(!this.dir) return;
        await writeFile(join(this.dir, config.dir, config.config), JSON.stringify(data));
    }

    static #updateConfig<T>(data: DeepPartial<T>, config: T){
        for(const key in data){
            if(!data?.[key] || !config?.[key]) continue;
            switch(typeof data[key]){
                case "object":
                    config[key] = Array.isArray(data[key]) ? data[key] as any : this.#updateConfig(data[key], config[key])
                break;
                default:
                    config[key] = data[key] as any;
                break;
            };
        };
        return config;
    }

    private async create(){
        return new Promise<Boolean>(async resolve => {
            const panelDir = join(this.dir, config.dir);
            mkdirSync(panelDir, { recursive: true });
            const read = await readFile(join(panelDir, config.config), { encoding: "utf-8" }).catch(()=>null);

            const [ schema ] = await Promise.all([
                Panel.updateConfig(read ? JSON.parse(read) : ConfigDefaultSchema) ?? ConfigDefaultSchema,
                writeFile(join(this.dir, config.bot), botFile)
            ]);

            return resolve(schema?.panel.status == "running");
        });
    };

    public static reloadRoutes(){
        this.webserver.load();
    };
};