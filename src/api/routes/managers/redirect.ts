import { createRoute } from "../../structures/apiserver";
import { AuthManager } from "../../structures/authManager";

export const data = createRoute({
    url: "/",
    method: "get",
    handler: async c => {
        console.log(c.req.raw.url)
        if(AuthManager.isReady) return c.redirect("https://panel.botforge.org");
        return c.redirect(`https://panel.botforge.org/login?token=${AuthManager.initToken}&redirect=${c.req.raw.url}`);
    }
});