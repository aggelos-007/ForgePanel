import { Compiler, ForgeClient, ForgeExtension, Interpreter } from "@tryforge/forgescript";
import { randomUUID } from "crypto";
import { OpCodes, TypedEventData } from "./events";
import { ClientUser, GuildFeature, PresenceStatusData } from "discord.js";
import { ConfigSchema } from "../config";

export enum SendType { 
    Information = 0,
    RequestReply = 1,
    Reply = 2
};

export enum ProcessCodes {
    WebSocketInfo = "WebSocketInfo",
    GetGuilds = "GetGuilds",
    GuildInfo = "GuildInfo",
    GuildLeave = "GuildLeave",
    ClientStats = "ClientStats",
    StatusUpdate = "StatusUpdate",
    StatusDelete = "StatusDelete",
    Appearence = "Appearence",
    ChangeAppearence = "ChangeAppearence",
    UpdateCommands = "UpdateCommands"
};

export type ProcessMessageData = {
    [ProcessCodes.WebSocketInfo]: TypedEventData;
    [ProcessCodes.GetGuilds]: {
        id: string;
        name: string;
        icon: string | null;
        banner: string | null;
        features: `${GuildFeature}`[];
        members: number | null;
    }[];
    [ProcessCodes.GuildInfo]: string | null | {
        id: string;
        name: string;
        icon: string | null;
        banner: string | null;
        features: `${GuildFeature}`[];
        members: number | null;
    };
    [ProcessCodes.GuildLeave]: string | null;
    [ProcessCodes.ClientStats]: null | {
        uptime: number;
        guilds: number;
        users: number | null;
    };
    [ProcessCodes.StatusUpdate]: {
        status: ConfigSchema["bot"]["status"];
        interval: ConfigSchema["bot"]["statusInterval"];
    };
    [ProcessCodes.StatusDelete]: never;
    [ProcessCodes.Appearence]: null | {
        username: string;
        avatar: string;
        banner: string | null;
    }
    [ProcessCodes.ChangeAppearence]: {
        username: "error" | string | undefined;
        avatar: "error" | string | undefined | null;
        banner: "error" | string | undefined | null;
    }
    [ProcessCodes.UpdateCommands]: never;
};

export interface ProcessMessages<Type extends SendType, Code extends ProcessCodes> {
    id?: Type extends SendType.Information ? never : string;
    type: Type;
    code: Code;
    data: ProcessMessageData[Code];
};

export type ProcessMessage = { [K in ProcessCodes]: ProcessMessages<SendType, K> }[ProcessCodes];

const pkg = require('../../package.json');
export class ForgePanel extends ForgeExtension {
    name: string = "ForgePanel";
    description: string = pkg.description;
    version: string = pkg.version;

    static Compiler = Compiler;
    Compiler = ForgePanel.Compiler;

    #client?: ForgeClient;
    constructor(private config: ConfigSchema["bot"]){super()}

    async init(client: ForgeClient){
        this.#client = client;
        process.on("message", this.#parentManager.bind(this));

        client.once("ready", (c) => {
            this.#client = c as ForgeClient;
            this.Compiler = ForgePanel.Compiler;
            this.#parentManager({
                type: SendType.Information,
                code: ProcessCodes.StatusUpdate,
                data: { status: this.config.status, interval: this.config.statusInterval }
            });
        });

        client.on("guildDelete", guild => {
            process.send?.({
                type: SendType.Information,
                code: ProcessCodes.WebSocketInfo,
                data: {
                    op: OpCodes.GuildLeave,
                    data: { id: guild.id }
                }
            } as ProcessMessages<SendType.Information, ProcessCodes.WebSocketInfo>);
        });

        client.on("guildCreate", guild => {
            process.send?.({
                type: SendType.Information,
                code: ProcessCodes.WebSocketInfo,
                data: {
                    op: OpCodes.GuildJoin,
                    data: {
                        id: guild.id,
                        name: guild.name,
                        icon: guild.iconURL({extension: "png", size:4096}),
                        banner: guild.bannerURL({extension: "png", size:4096}),
                        features: guild.features,
                        members: guild.memberCount > 0 ? guild.memberCount : null
                    }
                }
            } as ProcessMessages<SendType.Information, ProcessCodes.WebSocketInfo>);
        });
    };

    #pendingReplies = new Map<string, (data: any) => void>();
    #statusInterval: ReturnType<typeof setInterval> | null = null;

    async #parentManager(msg: ProcessMessage){
        if(!process.send) return;
        switch(msg.type){
            case SendType.Reply:
                if(msg.id && this.#pendingReplies.has(msg.id)){
                    const resolve = this.#pendingReplies.get(msg.id);
                    this.#pendingReplies.delete(msg.id);
                    resolve?.(msg);
                };
            break;
            case SendType.Information:
                switch(msg.code){
                    case ProcessCodes.StatusUpdate:
                        if(this.#statusInterval) clearInterval(this.#statusInterval);
                        const { status, interval } = msg.data;
                        if(status.length == 0) return this.#client?.user.setPresence({status: "online", activities: []});
                        let i = 0;
                        const setStatus = async () => {
                            let s = status[i++ % status.length];

                            let name;
                            if(this.#client) name = await Interpreter.run({
                                client: this.#client,
                                command: null,
                                data: this.Compiler.compile(s.name),
                                obj: {}
                            })

                            this.#client?.user.setPresence({
                                status: s.presence as PresenceStatusData,
                                activities: [{
                                    name: name ?? s.name,
                                    type: s.type,
                                    state: s.state,
                                    url: s.url
                                }]
                            })
                        }
                        setStatus();
                        this.#statusInterval = setInterval(setStatus, interval);
                    break;
                    case ProcessCodes.StatusDelete:
                        if(this.#statusInterval) clearInterval(this.#statusInterval);
                        this.#client?.user.setPresence({status: "online", activities: []})
                    break;
                    case ProcessCodes.UpdateCommands:
                        try {
                            this.#client?.commandManagers.forEach(s => s.refresh());
                        } catch(e){};
                        try {
                            this.#client?.applicationCommands.load();
                            this.#client?.applicationCommands.registerGlobal();
                        } catch(e){};
                    break;
                }
            break;
            case SendType.RequestReply:
                const data: Partial<ProcessMessage> = {
                    id: msg.id,
                    code: msg.code,
                    type: SendType.Reply
                };
                switch(msg.code){
                    case ProcessCodes.GetGuilds:
                        data.data = this.#client?.guilds.cache.map(s => {
                            return {
                                id: s.id,
                                name: s.name,
                                icon: s.iconURL({extension: "png", size:4096}),
                                banner: s.bannerURL({extension: "png", size:4096}),
                                features: s.features,
                                members: s.memberCount > 0 ? s.memberCount : null
                            }
                        }) ?? [];
                    break;
                    case ProcessCodes.GuildInfo:
                        const gi = this.#client?.guilds.cache.get(msg.data as string);
                        data.data = gi ? {
                            id: gi.id,
                            name: gi.name,
                            icon: gi.iconURL({extension: "png", size:4096}),
                            banner: gi.bannerURL({extension: "png", size:4096}),
                            features: gi.features,
                            members: gi.memberCount > 0 ? gi.memberCount : null
                        } : null;
                    break;
                    case ProcessCodes.GuildLeave:
                        data.data = (await this.#client?.guilds.cache.get(msg.data as string)?.leave())?.id ?? null;
                    break;
                    case ProcessCodes.ClientStats:
                        const users = this.#client?.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount ?? 0), 0);
                        data.data = this.#client ? {
                            uptime: this.#client.uptime,
                            guilds: this.#client.guilds.cache.size,
                            users: users && users > 0 ? users : null
                        } : null;
                    break;
                    case ProcessCodes.Appearence:
                        data.data = this.#client && this.#client.user ? {
                            username: this.#client.user.username,
                            banner: this.#client.user.bannerURL({extension: "png", size: 4096 }) ?? null,
                            avatar: this.#client.user.displayAvatarURL({extension: "png", size: 4096 })
                        } : null;
                    break;
                    case ProcessCodes.ChangeAppearence:
                        const [avatar, banner, username] = await Promise.all([
                            msg.data?.avatar !== undefined ? this.#client?.user?.setAvatar(msg.data?.avatar || null).catch(()=>"error") : undefined,
                            msg.data?.banner !== undefined ? this.#client?.user?.setBanner(msg.data.banner).catch(()=>"error") : undefined,
                            msg.data?.username && msg.data.username != this.#client?.user.username ? this.#client?.user?.setUsername(msg.data.username).catch(()=>"error") : undefined
                        ])
                        data.data = {avatar: avatar instanceof ClientUser ? avatar.displayAvatarURL() : avatar, banner: banner instanceof ClientUser ? banner.bannerURL() : banner, username:  username instanceof ClientUser ? username.username : username}
                    break;
                };
                process.send(data);
            break;
        };
    };

    askParent<T extends ProcessCodes>(data: Omit<ProcessMessages<SendType, T>, "type"> & { type?: SendType }){
        data.type = SendType.RequestReply;
        data.id = randomUUID();
        return new Promise(resolve => {
            const timeout = setTimeout(()=>{
                resolve(null);
                this.#pendingReplies.delete(data.id!);
            }, 5_000);
            const r = (data: ProcessMessages<SendType, T>) => {clearTimeout(timeout); resolve(data)};
            this.#pendingReplies.set(data.id!, r);
            process.send?.(data);
        });
    };

    sendParent<T extends ProcessCodes>(msg: Omit<ProcessMessages<SendType, T>, "type"> & { type?: SendType }){
        msg.type = SendType.Information;
        return process.send?.(msg);
    };
};