import { createRoute } from "../../structures/apiserver";
import { AuthManager, Permissions } from "../../structures/authManager";

interface schema {
    permissions: number;
}

const AllPerms = Object.values(Permissions).filter((v): v is number => typeof v === "number").reduce((a, b) => a + b, 0);
const validatePerms = (perms: number) => (perms & ~AllPerms) === 0;

export const data = createRoute({
    url: "/members/:id",
    method: ["get", "post", "patch", "delete"],
    auth: {
        methods: ["get", "post", "patch", "delete"],
        permissions: Permissions.ManageMembers
    },
    handler: async (c, reply) => {
        const id = c.req.param("id");
        if(!id) return reply.msg(400, "Invalid ID");
        let json: schema | null;
        if(c.req.method.toLowerCase() !== "get"){
            json = await c.req.json().catch(() => null) as schema | null;
            if(!json) return reply.msg(400, "Invalid JSON");
            if(typeof json.permissions !== "number") return reply.msg(400, "Invalid JSON");
            if(!validatePerms(json.permissions)) return reply.msg(400, "Invalid Permissions");
        };
        const f = AuthManager.getUser(id);
        switch(c.req.method.toLowerCase()){
            case "get":
                if(!f) return reply.msg(404, "Member not found");
                const { ["token"]: _, ...member } = f;
                return reply.succ(member);
            case "post":
                if(f) return reply.msg(400, "Member already exists");
                return reply.succ({ token: AuthManager.setUser({id, permissions: json!.permissions}) });
            case "patch":
                if(!f) return reply.msg(404, "Member not found");
                AuthManager.setUser({id, permissions: json!.permissions});
                return reply.succ();
            case "delete":
                if(!f) return reply.msg(404, "Member not found");
                AuthManager.deleteToken(id);
                return reply.succ();
        }
    }
});
