"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgePanel = exports.ProcessCodes = exports.SendType = void 0;
const forgescript_1 = require("@tryforge/forgescript");
const crypto_1 = require("crypto");
const events_1 = require("./events");
const discord_js_1 = require("discord.js");
var SendType;
(function (SendType) {
    SendType[SendType["Information"] = 0] = "Information";
    SendType[SendType["RequestReply"] = 1] = "RequestReply";
    SendType[SendType["Reply"] = 2] = "Reply";
})(SendType || (exports.SendType = SendType = {}));
;
var ProcessCodes;
(function (ProcessCodes) {
    ProcessCodes["WebSocketInfo"] = "WebSocketInfo";
    ProcessCodes["GetGuilds"] = "GetGuilds";
    ProcessCodes["GuildInfo"] = "GuildInfo";
    ProcessCodes["GuildLeave"] = "GuildLeave";
    ProcessCodes["ClientStats"] = "ClientStats";
    ProcessCodes["StatusUpdate"] = "StatusUpdate";
    ProcessCodes["StatusDelete"] = "StatusDelete";
    ProcessCodes["Appearence"] = "Appearence";
    ProcessCodes["ChangeAppearence"] = "ChangeAppearence";
    ProcessCodes["UpdateCommands"] = "UpdateCommands";
})(ProcessCodes || (exports.ProcessCodes = ProcessCodes = {}));
;
;
const pkg = require('../../package.json');
class ForgePanel extends forgescript_1.ForgeExtension {
    config;
    name = "ForgePanel";
    description = pkg.description;
    version = pkg.version;
    static Compiler = forgescript_1.Compiler;
    Compiler = ForgePanel.Compiler;
    #client;
    constructor(config) {
        super();
        this.config = config;
    }
    async init(client) {
        this.#client = client;
        process.on("message", this.#parentManager.bind(this));
        client.once("ready", (c) => {
            this.#client = c;
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
                    op: events_1.OpCodes.GuildLeave,
                    data: { id: guild.id }
                }
            });
        });
        client.on("guildCreate", guild => {
            process.send?.({
                type: SendType.Information,
                code: ProcessCodes.WebSocketInfo,
                data: {
                    op: events_1.OpCodes.GuildJoin,
                    data: {
                        id: guild.id,
                        name: guild.name,
                        icon: guild.iconURL({ extension: "png", size: 4096 }),
                        banner: guild.bannerURL({ extension: "png", size: 4096 }),
                        features: guild.features,
                        members: guild.memberCount > 0 ? guild.memberCount : null
                    }
                }
            });
        });
    }
    ;
    #pendingReplies = new Map();
    #statusInterval = null;
    async #parentManager(msg) {
        if (!process.send)
            return;
        switch (msg.type) {
            case SendType.Reply:
                if (msg.id && this.#pendingReplies.has(msg.id)) {
                    const resolve = this.#pendingReplies.get(msg.id);
                    this.#pendingReplies.delete(msg.id);
                    resolve?.(msg);
                }
                ;
                break;
            case SendType.Information:
                switch (msg.code) {
                    case ProcessCodes.StatusUpdate:
                        if (this.#statusInterval)
                            clearInterval(this.#statusInterval);
                        const { status, interval } = msg.data;
                        if (status.length == 0)
                            return this.#client?.user.setPresence({ status: "online", activities: [] });
                        let i = 0;
                        const setStatus = async () => {
                            let s = status[i++ % status.length];
                            let name;
                            if (this.#client)
                                name = await forgescript_1.Interpreter.run({
                                    client: this.#client,
                                    command: null,
                                    data: this.Compiler.compile(s.name),
                                    obj: {}
                                });
                            this.#client?.user.setPresence({
                                status: s.presence,
                                activities: [{
                                        name: name ?? s.name,
                                        type: s.type,
                                        state: s.state,
                                        url: s.url
                                    }]
                            });
                        };
                        setStatus();
                        this.#statusInterval = setInterval(setStatus, interval);
                        break;
                    case ProcessCodes.StatusDelete:
                        if (this.#statusInterval)
                            clearInterval(this.#statusInterval);
                        this.#client?.user.setPresence({ status: "online", activities: [] });
                        break;
                    case ProcessCodes.UpdateCommands:
                        try {
                            this.#client?.commandManagers.forEach(s => s.refresh());
                        }
                        catch (e) { }
                        ;
                        try {
                            this.#client?.applicationCommands.load();
                            this.#client?.applicationCommands.registerGlobal();
                        }
                        catch (e) { }
                        ;
                        break;
                }
                break;
            case SendType.RequestReply:
                const data = {
                    id: msg.id,
                    code: msg.code,
                    type: SendType.Reply
                };
                switch (msg.code) {
                    case ProcessCodes.GetGuilds:
                        data.data = this.#client?.guilds.cache.map(s => {
                            return {
                                id: s.id,
                                name: s.name,
                                icon: s.iconURL({ extension: "png", size: 4096 }),
                                banner: s.bannerURL({ extension: "png", size: 4096 }),
                                features: s.features,
                                members: s.memberCount > 0 ? s.memberCount : null
                            };
                        }) ?? [];
                        break;
                    case ProcessCodes.GuildInfo:
                        const gi = this.#client?.guilds.cache.get(msg.data);
                        data.data = gi ? {
                            id: gi.id,
                            name: gi.name,
                            icon: gi.iconURL({ extension: "png", size: 4096 }),
                            banner: gi.bannerURL({ extension: "png", size: 4096 }),
                            features: gi.features,
                            members: gi.memberCount > 0 ? gi.memberCount : null
                        } : null;
                        break;
                    case ProcessCodes.GuildLeave:
                        data.data = (await this.#client?.guilds.cache.get(msg.data)?.leave())?.id ?? null;
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
                            banner: this.#client.user.bannerURL({ extension: "png", size: 4096 }) ?? null,
                            avatar: this.#client.user.displayAvatarURL({ extension: "png", size: 4096 })
                        } : null;
                        break;
                    case ProcessCodes.ChangeAppearence:
                        const [avatar, banner, username] = await Promise.all([
                            msg.data?.avatar !== undefined ? this.#client?.user?.setAvatar(msg.data?.avatar || null).catch(() => "error") : undefined,
                            msg.data?.banner !== undefined ? this.#client?.user?.setBanner(msg.data.banner).catch(() => "error") : undefined,
                            msg.data?.username && msg.data.username != this.#client?.user.username ? this.#client?.user?.setUsername(msg.data.username).catch(() => "error") : undefined
                        ]);
                        data.data = { avatar: avatar instanceof discord_js_1.ClientUser ? avatar.displayAvatarURL() : avatar, banner: banner instanceof discord_js_1.ClientUser ? banner.bannerURL() : banner, username: username instanceof discord_js_1.ClientUser ? username.username : username };
                        break;
                }
                ;
                process.send(data);
                break;
        }
        ;
    }
    ;
    askParent(data) {
        data.type = SendType.RequestReply;
        data.id = (0, crypto_1.randomUUID)();
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                resolve(null);
                this.#pendingReplies.delete(data.id);
            }, 5_000);
            const r = (data) => { clearTimeout(timeout); resolve(data); };
            this.#pendingReplies.set(data.id, r);
            process.send?.(data);
        });
    }
    ;
    sendParent(msg) {
        msg.type = SendType.Information;
        return process.send?.(msg);
    }
    ;
}
exports.ForgePanel = ForgePanel;
;
