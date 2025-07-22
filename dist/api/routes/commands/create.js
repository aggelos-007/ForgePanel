"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const apiserver_1 = require("../../structures/apiserver");
const commands_1 = require("../../../managers/commands");
exports.data = (0, apiserver_1.createRoute)({
    url: "/commands/create",
    method: "post",
    async handler(c, reply) {
        const json = await c.req.json().catch(() => null);
        if (!json)
            return reply.msg(400, "Invalid JSON");
        if (json.type !== "commands" && json.type !== "slashes")
            return reply.msg(400, "Invalid type");
        if (!json.path || (!json.path.endsWith(".js") && !json.path.endsWith(".js.disabled")))
            return reply.msg(400, "Invalid path");
        const info = commands_1.CommandManager.createCommand(json.path, {
            commandData: json.data,
            type: json.type
        });
        if (!info)
            return reply.msg(500, "Failed to create command");
        return reply.succ({ id: info });
    }
});
