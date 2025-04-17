import tools from "$lib/tools";
import type { RouteMetadata } from "$lib/types";
import type { Request, Response } from "express";

export const meta: RouteMetadata = {
    description: "Returns the data of the current user",
    body: null,
    query: null,
    authorization: "User",
    comment: null
}

export async function exec(req: Request, res: Response) {
    return await tools.getUserData({
        accessToken: req.headers.authorization?.split(" ")[1]
    });
}