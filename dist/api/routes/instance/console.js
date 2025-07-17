"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const path_1 = require("path");
const promises_1 = require("fs/promises");
const config_1 = require("../../../config");
const apiserver_1 = require("../../structures/apiserver");
exports.data = (0, apiserver_1.createRoute)({
    url: "/server/console",
    method: "get",
    async handler(_, reply) {
        const file = await (0, promises_1.readFile)((0, path_1.join)(config_1.config.dir, "console.log"), { encoding: "utf-8" }).catch(() => { });
        if (!file)
            return reply.msg(500, "An error occured while trying to read console.");
        return reply.succ(file);
    }
});
