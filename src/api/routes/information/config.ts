import { ConfigSchema } from "../../../config";
import { InstanceManager, Panel } from "../../../managers";
import { createRoute } from "../../structures/apiserver";
import { Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/config",
    auth: {
        methods: ["get", "patch"],
        permissions: Permissions.ManageBot
    },
    method: ["get", "patch"],
    async handler(c, reply){
        switch(c.req.method.toLowerCase()){
            case "get":
                const { ["token"]: _, ...config } = Panel.config.bot
                return reply.succ(config)
            case "patch":
                const json = await c.req.json().catch(() => null) as ConfigSchema["bot"];
                if(!json) return reply.msg(400, "Invalid JSON");
                await Panel.updateConfig({ bot: json })
                InstanceManager.restart();
                return reply.succ();
        };
    }
})