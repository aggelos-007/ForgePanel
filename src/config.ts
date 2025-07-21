import { CommandType } from "@tryforge/forgescript";
import { ActivityType, BitFieldResolvable, GatewayIntentsString } from "discord.js"

const dir = ".panel";
export const config = {
    dir,
    config: "config.json",
    bot: "discord.js",
    commands: {
        base: "commands/base",
        slashes: "commands/application"
    }
};

export type ConfigSchema = {
    bot: {
        client: {
            intents: BitFieldResolvable<GatewayIntentsString, number>;
            events: CommandType[];            
            prefixes: string[];
            respondOnEdit: boolean;
            prefixCaseInsensitive: boolean;
            allowBots: boolean;
            trackers: {
                invites: boolean;
                voice: boolean;
            };
            mobile: boolean;
        };
        status: {
            presence: string;
            type: ActivityType;
            name: string;
            state?: string;
            url?: string;
        }[];
        statusInterval: number;
        extensions: string[];
        token: string;
    };
    panel: {
        status: "running" | "stopped";
    };
};

export const ConfigDefaultSchema: ConfigSchema = {
    bot: {
        client: {
            intents: [],
            events: [],
            prefixes: [],
            respondOnEdit: false,
            prefixCaseInsensitive: false,
            allowBots: false,
            trackers: {
                invites: false,
                voice: false,
            },
            mobile: false,
        },
        extensions: [],
        status: [],
        statusInterval: 30_000,
        token: "OTM3Nzc0MTkzNDc3NTUwMDkx.GY9cRu.tED3361GsTtrOG-YMPOFC1PFsSnOW9k5BeS044",
    },
    panel: {
        status: "stopped"
    }
};

export const botFile = `
const { ExtensionsManager, ForgePanel } = require("@tryforge/forge.panel");
const { Compiler, ForgeClient } = require("@tryforge/forgescript");
const config = require("./.panel/config.json");
const { existsSync } = require("fs");

const client = new ForgeClient({
    ...config.bot.client,
    extensions: new ExtensionsManager(config.bot)
});

ForgePanel.Compiler = Compiler;

if(existsSync('./commands/base')) client.commands.load('./commands/base');
if(existsSync('./commands/application')) client.applicationCommands.load('./commands/application');


client.login(config.bot.token);
`.trim();