import { GatewayIntentBits, GatewayIntentsString } from "discord.js";
import { createRoute } from "../../structures/apiserver";
import { InstanceManager, Panel } from "../../../managers";

function areValidIntents(intents: string[]) {
    const validIntents = new Set<GatewayIntentsString>(Object.keys(GatewayIntentBits) as GatewayIntentsString[]);
    return intents.every((intent) => validIntents.has(intent as GatewayIntentsString))
}

export const data = createRoute({
    url: "/client/intents",
    method: ["get", "patch"],
    async handler(c, reply) {
        switch(c.req.method.toLowerCase()){
            case "patch":
                const json = await c.req.json().catch(()=>null);
                const intents = json?.intents;
                if(!intents || !Array.isArray(intents) || !(await areValidIntents(intents))) return reply.msg(400, "Invalid intents");
                await Panel.updateConfig({ bot: { client: { intents }} })
                if(InstanceManager.child) InstanceManager.restart();
                return reply.succ()
            case "get":
                return reply.succ(Panel.config.bot.client.intents);
        }
    },
})