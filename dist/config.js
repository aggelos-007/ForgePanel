"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botFile = exports.ConfigDefaultSchema = exports.config = void 0;
const dir = ".panel";
exports.config = {
    dir,
    config: "config.json",
    bot: "discord.js",
    commands: {
        base: "commands/base",
        slashes: "commands/application"
    }
};
exports.ConfigDefaultSchema = {
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
exports.botFile = `
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
