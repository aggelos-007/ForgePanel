"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const discord_js_1 = require("discord.js");
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/appearance",
    method: ["get", "patch"],
    auth: {
        methods: ["patch"],
        permissions: authManager_1.Permissions.ManageBot
    },
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const json = await c.req.json();
                const data = await new discord_js_1.REST().setToken(managers_1.Panel.config.bot.token).patch(discord_js_1.Routes.user("@me"), { body: json }).catch(() => null);
                if (!data)
                    return reply.msg(500, "Failed to change appearence");
                managers_1.InstanceManager.sendMessage({ code: managers_1.ProcessCodes.ChangeAppearence });
                return reply.succ();
            case "get":
                const res = await managers_1.InstanceManager.askChild({ code: managers_1.ProcessCodes.Appearence });
                if (res)
                    return reply.succ(res.data);
                if (res == null)
                    return reply.msg(500, "Server failed to respond");
                else
                    return reply.msg(500, "Server is offline");
        }
        ;
    }
});
