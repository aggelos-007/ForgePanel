"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/server/stop",
    auth: {
        methods: ["post"],
        permissions: authManager_1.Permissions.ManagePower
    },
    method: "post",
    async handler(_, reply) {
        const manager = managers_1.InstanceManager;
        if (!manager.child)
            return reply.msg(500, "Bot server is not running!");
        await manager.stop();
        return reply.succ();
    }
});
