import { CommandManager } from "../../../managers/commands";
import { createRoute } from "../../structures/apiserver";

interface IBody {
    path: string;
    type: "commands" | "slashes";
}

export const data = createRoute({
    url: "/commands/action/:id",
    method: ["patch", "delete", "put"],
    async handler(c, reply) {
        const id = Number(c.req.param("id"));
        const body = await c.req.json().catch(() => null) as IBody;
        if(!body) return reply.msg(400, "Invalid body");
        if(body.type !== "commands" && body.type !== "slashes") return reply.msg(400, "Invalid type");
        switch(c.req.method.toLowerCase()){
            case "patch":
                const infoPatch = CommandManager.enableCommand(id, body.type);
                if(!infoPatch) return reply.msg(500, "Failed to enable command");
                return reply.succ()
            case "delete":
                const infoDelete = CommandManager.disableCommand(id, body.type);
                if(!infoDelete) return reply.msg(500, "Failed to disable command");
                return reply.succ()
            case "put":
                const infoPut = CommandManager.moveCommand({ id, path: body.path, type: body.type });
                if(!infoPut) return reply.msg(500, "Failed to move command");
                return reply.succ()
        }
    },
})