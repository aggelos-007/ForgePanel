import { InstanceManager, ProcessCodes } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

export const data = createRoute({
    url: "/client/guild/:id",
    method: ["get", "delete"],
    async handler(c, reply){
        switch(c.req.method.toLowerCase()){
            case "delete":
                const data = await InstanceManager.askChild({code: ProcessCodes.GuildLeave, data: c.req.param("id")});
                if(data){
                    if(data.data == null) return reply.msg(404,"Server not found");
                    return reply.succ(data.data);
                };
                if(data == null) return reply.msg(500, "Server failed to respond");
                else return reply.msg(500, "Server is offline");
            case "get":
                const info = await InstanceManager.askChild({code: ProcessCodes.GuildInfo, data: c.req.param("id")});
                if(info){
                    if(info.data == null) return reply.msg(404, "Server not found");
                    return reply.succ(info.data);
                };
                if(info == null) return reply.msg(500, "Server failed to respond");
                else return reply.msg(500, "Server is offline");
        };
    }
})