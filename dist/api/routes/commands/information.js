"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const path_1 = require("path");
const commands_1 = require("../../../managers/commands");
const apiserver_1 = require("../../structures/apiserver");
const config_1 = require("../../../config");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/commands/:id?",
    method: "get",
    auth: {
        methods: ["get"],
        permissions: authManager_1.Permissions.ManageCommands
    },
    async handler(c, reply) {
        const id = Number(c.req.param("id"));
        const type = c.req.query("type");
        if (!type)
            return reply.msg(400, "Invalid type");
        if (type !== "commands" && type !== "slashes")
            return reply.msg(400, "Invalid type");
        if (isNaN(id)) {
            const data = [];
            for (let i = 0; i < commands_1.CommandManager[`${type}Path`].length; i++) {
                let path = commands_1.CommandManager[`${type}Path`][i];
                if (!path)
                    continue;
                path = path.replace((0, path_1.join)(commands_1.CommandManager.dir, config_1.config.commands[type == "commands" ? "base" : "slashes"]), "");
                data.push({ path, id: i, disabled: path.endsWith(".disabled") });
            }
            return reply.succ(data);
        }
        ;
        if (commands_1.CommandManager[`${type}Path`][id] == null)
            return reply.msg(400, "Invalid ID");
        return reply.succ(commands_1.CommandManager[`${type}Map`].get(commands_1.CommandManager[`${type}Path`][id]));
    }
});
