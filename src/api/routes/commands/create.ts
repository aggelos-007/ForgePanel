import { IApplicationCommandData, IBaseCommand } from "@tryforge/forgescript";
import { createRoute } from "../../structures/apiserver";
import { CommandManager } from "../../../managers/commands";
import { Permissions } from "../../structures/authManager";

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

type IBody = ICommandsBody | ISlashesBody;

export const data = createRoute({
    url: "/commands/create",
    method: "post",
    auth: {
        methods: ["post"],
        permissions: Permissions.ManageCommands
    },
    async handler(c, reply){
        const json = await c.req.json().catch(() => null) as IBody;
        if(!json) return reply.msg(400, "Invalid JSON");
        if(json.type !== "commands" && json.type !== "slashes") return reply.msg(400, "Invalid type");
        if(!json.path || (!json.path.endsWith(".js") && !json.path.endsWith(".js.disabled"))) return reply.msg(400, "Invalid path");
        const info = CommandManager.createCommand(json.path, {
            commandData: json.data,
            type: json.type
        } as any);
        if(!info) return reply.msg(500, "Failed to create command");
        return reply.succ({ id: info })
    }
})