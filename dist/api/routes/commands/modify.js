"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const apiserver_1 = require("../../structures/apiserver");
const commands_1 = require("../../../managers/commands");
exports.data = (0, apiserver_1.createRoute)({
    url: "/commands/:id",
    method: ["patch", "delete"],
    async handler(c, reply) {
        const id = Number(c.req.param("id"));
        const body = await c.req.json().catch(() => null);
        if (!body)
            return reply.msg(400, "Invalid body");
        if (body.type !== "commands" && body.type !== "slashes")
            return reply.msg(400, "Invalid type");
        if (isNaN(id) || commands_1.CommandManager[`${body.type}Path`]?.[id] == null)
            return reply.msg(400, "Invalid ID");
        switch (c.req.method.toLowerCase()) {
            case "patch":
                const info = commands_1.CommandManager.editCommand(id, {
                    commandData: body.data,
                    type: body.type
                });
                if (!info)
                    return reply.msg(500, "Failed to edit command");
                return reply.succ();
            case "delete":
                const infoDel = commands_1.CommandManager.deleteCommand(id, body.type);
                if (!infoDel)
                    return reply.msg(500, "Failed to delete command");
                return reply.succ();
        }
    }
});
