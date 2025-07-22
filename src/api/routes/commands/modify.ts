import { IApplicationCommandData, IBaseCommand } from "@tryforge/forgescript";
import { createRoute } from "../../structures/apiserver";
import { CommandManager } from "../../../managers/commands";

interface ICommandsBody {
    type: "commands";
    path: string;
    data: IBaseCommand<string>;
}
interface ISlashesBody{
    type: "slashes";
    path: string;
    data: IApplicationCommandData;
}

interface IDeleteBody {
    type: "commands" | "slashes";
}

type IPatchBody = ICommandsBody | ISlashesBody

type IBody = IPatchBody | IDeleteBody;

export const data = createRoute({
    url: "/commands/:id",
    method: ["patch", "delete"],
    async handler(c, reply){
        const id = Number(c.req.param("id"));
        const body = await c.req.json().catch(() => null) as IBody;
        if(!body) return reply.msg(400, "Invalid body");
        if(body.type !== "commands" && body.type !== "slashes") return reply.msg(400, "Invalid type");
        if(isNaN(id) || CommandManager[`${body.type}Path`]?.[id] == null) return reply.msg(400, "Invalid ID");
        switch(c.req.method.toLowerCase()){
            case "patch":
                const info = CommandManager.editCommand(id, {
                    commandData: (body as IPatchBody).data,
                    type: body.type
                } as any);
                if(!info) return reply.msg(500, "Failed to edit command");
                return reply.succ()
            case "delete":
                const infoDel = CommandManager.deleteCommand(id, body.type);
                if(!infoDel) return reply.msg(500, "Failed to delete command");
                return reply.succ()
        }
    }
})