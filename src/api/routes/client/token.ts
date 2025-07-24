import { InstanceManager, Panel } from "../../../managers";
import { createRoute } from "../../structures/apiserver";
import { Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/client/token",
    method: "patch",
    auth: {
        methods: ["patch"],
        permissions: Permissions.ManageBot
    },
    async handler(c, reply){
        const json = await c.req.json().catch(()=>null)
        const token = json?.token
        if(!token || typeof token !== "string") return reply.msg(400, "Invalid token provided.");
        const check = await fetch("https://discord.com/api/v10/users/@me", {
            headers: {
                Authorization: `Bot ${token}`
            }
        })
        if(check.status !== 200) return reply.msg(400, "Invalid token provided.");
        await Panel.updateConfig({ bot: { token } })
        if(InstanceManager.child) InstanceManager.restart();
        return reply.succ()
    }
});