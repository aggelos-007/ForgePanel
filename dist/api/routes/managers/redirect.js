"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
const apiserver_1 = require("../../structures/apiserver");
const authManager_1 = require("../../structures/authManager");
exports.data = (0, apiserver_1.createRoute)({
    url: "/",
    method: "get",
    handler: async (c) => {
        console.log(c.req.raw.url);
        if (authManager_1.AuthManager.isReady)
            return c.redirect("https://panel.botforge.org");
        return c.redirect(`https://panel.botforge.org/login?token=${authManager_1.AuthManager.initToken}&redirect=${c.req.raw.url}`);
    }
});
