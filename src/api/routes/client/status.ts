import { InstanceManager, Panel, ProcessCodes } from "../../../managers";
import { ActivityType } from "discord.js";
import { createRoute } from "../../structures/apiserver";
import { Permissions } from "../../structures/authManager";

interface IBody {
    status?: any | any[],
    interval?: number;
}

export const data = createRoute({
    url: "/client/status",
    method: ["get", "patch", "delete"],
    auth: {
        methods: ["patch", "delete"],
        permissions: Permissions.ManageBot
    },
    async handler(c, reply){
        switch(c.req.method.toLowerCase()){
            case "patch":
                const body = await c.req.json().catch(()=>null) as IBody | null;
                if(!body || (!body.interval && !body.status)) return reply.msg(400, "Invalid form of body.");

                if(typeof body.interval !== "undefined" && (typeof body.interval != "number" || body.interval <= 5_000)) return reply.msg(400, "Interval must be a number above 5000ms");
                if(body.status && (Array.isArray(body.status) ?  body.status : [body.status]).find(s => typeof s.name !== "string" || typeof s.presence !== "string" || typeof s.type !== "number" || s.type > 5 || s.type < 0 || (s.type === ActivityType.Streaming && typeof s.url !== "string") || (s.state !== undefined && typeof s.state !== "string"))) return reply.msg(400, "Wrong form of body.");

                await InstanceManager.sendMessage({code: ProcessCodes.StatusUpdate, data: { status: body.status ? (Array.isArray(body.status) ? body.status : [body.status]) : Panel.config.bot.status, interval: body.interval ?? Panel.config.bot.statusInterval }});
                Panel.updateConfig({bot: {status: Array.isArray(body.status) ? body.status : [body.status], statusInterval: body.interval}})
                return reply.succ();
            case "delete":
                const del = await InstanceManager.sendMessage({code: ProcessCodes.StatusDelete});
                Panel.updateConfig({bot: {status: []}})
                if(del) return reply.succ();
                if(del == null) return reply.msg(500, "Server is offline");
                else return reply.msg(500, "Server failed to respond");
            case "get":
                return reply.succ({ status: Panel.config.bot.status, interval: Panel.config.bot.statusInterval });
        };
    }
})