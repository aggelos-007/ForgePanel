"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const discord_js_1 = require("discord.js");
const apiserver_1 = require("../../structures/apiserver");
const managers_1 = require("../../../managers");
function areValidIntents(intents) {
    const validIntents = new Set(Object.keys(discord_js_1.GatewayIntentBits));
    return intents.every((intent) => validIntents.has(intent));
}
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/intents",
    method: ["get", "patch"],
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const json = await c.req.json().catch(() => null);
                const intents = json?.intents;
                if (!intents || !Array.isArray(intents) || !(await areValidIntents(intents)))
                    return reply.msg(400, "Invalid intents");
                await managers_1.Panel.updateConfig({ bot: { client: { intents } } });
                if (managers_1.InstanceManager.child)
                    managers_1.InstanceManager.restart();
                return reply.succ();
            case "get":
                return reply.succ(managers_1.Panel.config.bot.client.intents);
        }
    },
});
