import { InstanceManager, ProcessCodes } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/client/stats",
    method: "get",
    async handler(_, reply){
        const data = await InstanceManager.askChild({code: ProcessCodes.ClientStats});
        if(data){
            if(data.data == null) return reply.msg(404, "Stats not found!");
            return reply.succ(data.data);
        };
        if(data == null) return reply.msg(500, "Server failed to respond");
        else return reply.msg(500,"Server is offline");
    }
});