import { createRoute } from "../../structures/apiserver";
import { AuthManager, Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/members",
    method: "get",
    auth: {
        methods: ["get"],
        permissions: Permissions.ManageMembers
    },
    handler: async (_, reply) => {
        const members = AuthManager.getUsers().map(s => ({
            id: s.id,
            permissions: s.permissions
        }));
        return reply.succ(members);
    }
});