"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/register",
    method: "post",
    handler: async (c, reply) => {
        if (authManager_1.AuthManager.isReady)
            return c.notFound();
        if (authManager_1.AuthManager.initToken != c.req.header("Authorization"))
            return reply.msg(401, "Unauthorized");
        const json = await c.req.json().catch(() => null);
        if (!json)
            return reply.msg(400, "Invalid JSON");
        if (!json.userId || !json.data.token)
            return reply.msg(400, "Invalid JSON");
        const check = await fetch("https://discord.com/api/v10/users/@me", {
            headers: {
                Authorization: `Bot ${json.data.token}`
            }
        });
        if (check.status !== 200)
            return reply.msg(400, "Invalid token provided.");
        managers_1.Panel.updateConfig({ bot: json.data });
        return reply.succ({
            token: authManager_1.AuthManager.setUser({ id: json.userId, permissions: Object.values(authManager_1.Permissions).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0) })
        });
    }
});
