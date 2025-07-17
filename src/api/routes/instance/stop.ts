import { InstanceManager } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/server/stop",
    method: "post",
    async handler(_, reply){
        const manager = InstanceManager;
        if(!manager.child) return reply.msg(500, "Bot server is not running!");
        await manager.stop();
        return reply.succ();
    }
});