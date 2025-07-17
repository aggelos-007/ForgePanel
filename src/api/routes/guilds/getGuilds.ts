import { InstanceManager, ProcessCodes } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/client/guilds",
    method: "get",
    async handler(_, reply){
        const data = await InstanceManager.askChild({code: ProcessCodes.GetGuilds})
        if(data) return reply.succ(data.data);
        if(data == null) return reply.msg(500, "Server failed to respond");
        else return reply.msg(500, "Server is offline");
    }
});