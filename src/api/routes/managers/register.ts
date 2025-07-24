import { ConfigSchema } from "../../../config";
import { DeepPartial, Panel } from "../../../managers";
import { createRoute } from "../../structures/apiserver";
import { AuthManager, Permissions } from "../../structures/authManager";

interface schema {
    userId: string;
    data: DeepPartial<ConfigSchema["bot"]>
}

export const data = createRoute({
    url: "/register",
    method: "post",
    handler: async (c, reply) => {
        if(AuthManager.isReady) return c.notFound()
        if(AuthManager.initToken != c.req.header("Authorization")) return reply.msg(401, "Unauthorized");

        const json = await c.req.json().catch(() => null) as schema | null;
        if(!json) return reply.msg(400, "Invalid JSON");
        if(!json.userId || !json.data.token) return reply.msg(400, "Invalid JSON");
        const check = await fetch("https://discord.com/api/v10/users/@me", {
            headers: {
                Authorization: `Bot ${json.data.token}`
            }
        })
        if(check.status !== 200) return reply.msg(400, "Invalid token provided.");
        Panel.updateConfig({ bot: json.data })
        return reply.succ({
            token: AuthManager.setUser({id: json.userId, permissions: Object.values(Permissions).filter((v): v is number => typeof v === "number").reduce((a, b) => a + b, 0)})
        })
    }
});