"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const child_process_1 = require("child_process");
const apiserver_1 = require("../../structures/apiserver");
const managers_1 = require("../../../managers");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/server/packages",
    method: ["get", "post", "delete"],
    auth: {
        methods: ["post", "delete"],
        permissions: authManager_1.Permissions.ManageTerminal
    },
    async handler(c, reply) {
        const body = await c.req.json().catch(() => null);
        switch (c.req.method.toLowerCase()) {
            case "get":
                delete require.cache[require.resolve(`${managers_1.Panel.dir}/package.json`)];
                const json = require(`${managers_1.Panel.dir}/package.json`);
                return reply.succ(json.dependencies);
            case "post":
                if (!body)
                    return reply.msg(400, "Invalid body");
                try {
                    const pkgManager = managers_1.Panel.config.panel.pkgManager;
                    (0, child_process_1.execSync)(`${pkgManager} ${pkgManager == "npm" ? "install" : "add"} ${body.name}`);
                    return reply.succ();
                }
                catch {
                    return reply.msg(500, "Failed to install package");
                }
            case "delete":
                if (!body)
                    return reply.msg(400, "Invalid body");
                try {
                    const pkgManager = managers_1.Panel.config.panel.pkgManager;
                    (0, child_process_1.execSync)(`${pkgManager} ${pkgManager == "npm" ? "uninstall" : "remove"} ${body.name}`);
                    return reply.succ();
                }
                catch {
                    return reply.msg(500, "Failed to uninstall package");
                }
        }
        ;
    }
});
