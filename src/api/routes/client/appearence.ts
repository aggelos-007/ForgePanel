import { InstanceManager, ProcessCodes } from "../../../managers";
import { createRoute } from "../../structures/apiserver";

interface IBody {
    username?: string,
    avatar?: string | null;
    banner?: string | null;
}

export const data = createRoute({
    url: "/client/appearence",
    method: ["get", "patch"],
    async handler(c, reply){
        switch(c.req.method.toLowerCase()){
            case "patch":
                const json = await c.req.json()
            case "get":
                const res = await InstanceManager.askChild({ code: ProcessCodes.Appearence })
                if(res) return reply.succ(res.data);
                if(res == null) return reply.msg(500, "Server failed to respond");
                else return reply.msg(500, "Server is offline");
        };
    }
})