import { AttachmentBuilder, REST, Routes } from "discord.js";
import { InstanceManager, Panel, ProcessCodes } from "../../../managers";
import { createRoute } from "../../structures/apiserver";
import { Permissions } from "../../structures/authManager";

interface IBody {
    username?: string,
    avatar?: string | null;
    banner?: string | null;
}

export const data = createRoute({
    url: "/client/appearance",
    method: ["get", "patch"],
    auth: {
        methods: ["patch"],
        permissions: Permissions.ManageBot
    },
    async handler(c, reply){
        switch(c.req.method.toLowerCase()){
            case "patch":
                const json = await c.req.json() as IBody;
                const data = await new REST().setToken(Panel.config.bot.token).patch(Routes.user("@me"), { body: json }).catch(() => null);
                if(!data) return reply.msg(500, "Failed to change appearence");
                InstanceManager.sendMessage({ code: ProcessCodes.ChangeAppearence })
                return reply.succ()
            case "get":
                const res = await InstanceManager.askChild({ code: ProcessCodes.Appearence })
                if(res) return reply.succ(res.data);
                if(res == null) return reply.msg(500, "Server failed to respond");
                else return reply.msg(500, "Server is offline");
        };
    }
})