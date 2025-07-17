"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/token",
    method: "patch",
    async handler(c, reply) {
        const json = await c.req.json().catch(() => null);
        const token = json?.token;
        if (!token || typeof token !== "string")
            return reply.msg(400, "Invalid token provided.");
        const check = await fetch("https://discord.com/api/v10/users/@me", {
            headers: {
                Authorization: `Bot ${token}`
            }
        });
        if (check.status !== 200)
            return reply.msg(400, "Invalid token provided.");
        await managers_1.Panel.updateConfig({ bot: { token } });
        if (managers_1.InstanceManager.child)
            managers_1.InstanceManager.restart();
        return reply.succ();
    }
});
