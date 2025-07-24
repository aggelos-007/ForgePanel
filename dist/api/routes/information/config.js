"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/config",
    auth: {
        methods: ["get", "patch"],
        permissions: authManager_1.Permissions.ManageBot
    },
    method: ["get", "patch"],
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "get":
                const { ["token"]: _, ...config } = managers_1.Panel.config.bot;
                return reply.succ(config);
            case "patch":
                const json = await c.req.json().catch(() => null);
                if (!json)
                    return reply.msg(400, "Invalid JSON");
                await managers_1.Panel.updateConfig({ bot: json });
                managers_1.InstanceManager.restart();
                return reply.succ();
        }
        ;
    }
});
