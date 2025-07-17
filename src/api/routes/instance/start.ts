import { InstanceManager } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/server/start",
    method: "post",
    async handler(_, reply){
        const manager = InstanceManager;
        if(manager.child) return reply.msg(500, "Bot server has already started!");
        await manager.start();
        return reply.succ();
    }
});