"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const discord_js_1 = require("discord.js");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/status",
    method: ["get", "patch", "delete"],
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const body = await c.req.json().catch(() => null);
                if (!body || (!body.interval && !body.status))
                    return reply.msg(400, "Invalid form of body.");
                if (typeof body.interval !== "undefined" && (typeof body.interval != "number" || body.interval <= 5_000))
                    return reply.msg(400, "Interval must be a number above 5000ms");
                if (body.status && (Array.isArray(body.status) ? body.status : [body.status]).find(s => typeof s.name !== "string" || typeof s.presence !== "string" || typeof s.type !== "number" || s.type > 5 || s.type < 0 || (s.type === discord_js_1.ActivityType.Streaming && typeof s.url !== "string") || (s.state !== undefined && typeof s.state !== "string")))
                    return reply.msg(400, "Wrong form of body.");
                await managers_1.InstanceManager.sendMessage({ code: managers_1.ProcessCodes.StatusUpdate, data: { status: body.status ? (Array.isArray(body.status) ? body.status : [body.status]) : managers_1.Panel.config.bot.status, interval: body.interval ?? managers_1.Panel.config.bot.statusInterval } });
                managers_1.Panel.updateConfig({ bot: { status: Array.isArray(body.status) ? body.status : [body.status], statusInterval: body.interval } });
                return reply.succ();
            case "delete":
                const del = await managers_1.InstanceManager.sendMessage({ code: managers_1.ProcessCodes.StatusDelete });
                managers_1.Panel.updateConfig({ bot: { status: [] } });
                if (del)
                    return reply.succ();
                if (del == null)
                    return reply.msg(500, "Server is offline");
                else
                    return reply.msg(500, "Server failed to respond");
            case "get":
                return reply.succ({ status: managers_1.Panel.config.bot.status, interval: managers_1.Panel.config.bot.statusInterval });
        }
        ;
    }
});
