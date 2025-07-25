"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const managers_1 = require("../../../managers");
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
const AllPerms = Object.values(authManager_1.Permissions).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0);
const validatePerms = (perms) => (perms & ~AllPerms) === 0;
exports.data = (0, apiserver_1.createRoute)({
    url: "/members/:id",
    method: ["get", "post", "patch", "delete"],
    auth: {
        methods: ["get", "post", "patch", "delete"],
        permissions: authManager_1.Permissions.ManageMembers
    },
    handler: async (c, reply) => {
        const id = c.req.param("id");
        if (!id)
            return reply.msg(400, "Invalid ID");
        let json;
        if (c.req.method.toLowerCase() !== "get") {
            json = await c.req.json().catch(() => null);
            if (!json)
                return reply.msg(400, "Invalid JSON");
            if (typeof json.permissions !== "number")
                return reply.msg(400, "Invalid JSON");
            if (!validatePerms(json.permissions))
                return reply.msg(400, "Invalid Permissions");
        }
        ;
        const f = authManager_1.AuthManager.getUser(id);
        switch (c.req.method.toLowerCase()) {
            case "get":
                if (!f)
                    return reply.msg(404, "Member not found");
                const { ["token"]: _, ...member } = f;
                return reply.succ(member);
            case "post":
                if (f)
                    return reply.msg(400, "Member already exists");
                const token = authManager_1.AuthManager.setUser({ id, permissions: json.permissions });
                managers_1.emitter.emit("websocket", {
                    op: managers_1.OpCodes.MemberCreate,
                    data: {
                        id,
                        permissions: json.permissions
                    }
                });
                return reply.succ({ token });
            case "patch":
                if (!f)
                    return reply.msg(404, "Member not found");
                authManager_1.AuthManager.setUser({ id, permissions: json.permissions });
                managers_1.emitter.emit("websocket", {
                    op: managers_1.OpCodes.MemberUpdate,
                    data: {
                        old: {
                            id,
                            permissions: f.permissions
                        },
                        new: {
                            id,
                            permissions: json.permissions
                        }
                    }
                });
                return reply.succ();
            case "delete":
                if (!f)
                    return reply.msg(404, "Member not found");
                authManager_1.AuthManager.deleteToken(id);
                managers_1.emitter.emit("websocket", {
                    op: managers_1.OpCodes.MemberDelete,
                    data: { id }
                });
                return reply.succ();
        }
    }
});
