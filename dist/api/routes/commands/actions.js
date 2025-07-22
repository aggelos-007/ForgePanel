"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const commands_1 = require("../../../managers/commands");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/commands/action/:id",
    method: ["patch", "delete", "put"],
    async handler(c, reply) {
        const id = Number(c.req.param("id"));
        const body = await c.req.json().catch(() => null);
        if (!body)
            return reply.msg(400, "Invalid body");
        if (body.type !== "commands" && body.type !== "slashes")
            return reply.msg(400, "Invalid type");
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const infoPatch = commands_1.CommandManager.enableCommand(id, body.type);
                if (!infoPatch)
                    return reply.msg(500, "Failed to enable command");
                return reply.succ();
            case "delete":
                const infoDelete = commands_1.CommandManager.disableCommand(id, body.type);
                if (!infoDelete)
                    return reply.msg(500, "Failed to disable command");
                return reply.succ();
            case "put":
                const infoPut = commands_1.CommandManager.moveCommand({ id, path: body.path, type: body.type });
                if (!infoPut)
                    return reply.msg(500, "Failed to move command");
                return reply.succ();
        }
    },
});
