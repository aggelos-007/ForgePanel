"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/guild/:id",
    method: ["get", "delete"],
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "delete":
                const data = await managers_1.InstanceManager.askChild({ code: managers_1.ProcessCodes.GuildLeave, data: c.req.param("id") });
                if (data) {
                    if (data.data == null)
                        return reply.msg(404, "Server not found");
                    return reply.succ(data.data);
                }
                ;
                if (data == null)
                    return reply.msg(500, "Server failed to respond");
                else
                    return reply.msg(500, "Server is offline");
            case "get":
                const info = await managers_1.InstanceManager.askChild({ code: managers_1.ProcessCodes.GuildInfo, data: c.req.param("id") });
                if (info) {
                    if (info.data == null)
                        return reply.msg(404, "Server not found");
                    return reply.succ(info.data);
                }
                ;
                if (info == null)
                    return reply.msg(500, "Server failed to respond");
                else
                    return reply.msg(500, "Server is offline");
        }
        ;
    }
});
