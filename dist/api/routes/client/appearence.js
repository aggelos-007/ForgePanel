"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/client/appearence",
    method: ["get", "patch"],
    async handler(c, reply) {
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const json = await c.req.json();
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
