import { InstanceManager } from "../../../managers";
import { createRoute } from "../../structures/apiserver";
import { Permissions } from "../../structures/authManager";

export const data = createRoute({
    url: "/server/stop",
    auth: {
        methods: ["post"],
        permissions: Permissions.ManagePower
    },
    method: "post",
    async handler(_, reply){
        const manager = InstanceManager;
        if(!manager.child) return reply.msg(500, "Bot server is not running!");
        await manager.stop();
        return reply.succ();
    }
});