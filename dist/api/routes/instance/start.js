"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/server/start",
    method: "post",
    async handler(_, reply) {
        const manager = managers_1.InstanceManager;
        if (manager.child)
            return reply.msg(500, "Bot server has already started!");
        await manager.start();
        return reply.succ();
    }
});
