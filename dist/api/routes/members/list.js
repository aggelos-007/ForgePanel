"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/members",
    method: "get",
    auth: {
        methods: ["get"],
        permissions: authManager_1.Permissions.ManageMembers
    },
    handler: async (_, reply) => {
        const members = authManager_1.AuthManager.getUsers().map(s => ({
            id: s.id,
            permissions: s.permissions
        }));
        return reply.succ(members);
    }
});
