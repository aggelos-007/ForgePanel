"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/stats",
    method: "get",
    async handler(_, reply) {
        const data = await managers_1.InstanceManager.askChild({ code: managers_1.ProcessCodes.ClientStats });
        if (data) {
            if (data.data == null)
                return reply.msg(404, "Stats not found!");
            return reply.succ(data.data);
        }
        ;
        if (data == null)
            return reply.msg(500, "Server failed to respond");
        else
            return reply.msg(500, "Server is offline");
    }
});
