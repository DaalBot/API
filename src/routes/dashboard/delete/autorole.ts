import tools from "$lib/tools";
import type { RouteMetadata } from "$lib/types";
import type { Request, Response } from "express";

export const meta: RouteMetadata = {
    description: "Deletes an automatically assigned role from the server.",
    body: null,
    query: {
        role: {
            description: "The role ID to delete.",
            type: "string",
            required: true
        }
    },
    authorization: "None",
    returns: {
        200: [{
            type: "string",
            example: "Successfully deleted autorole"
        }],
        400: [{
            type: "string",
            example: "Missing required parameter 'role'."
        }],
        404: [{
            type: "string",
            example: "Autorole not found"
        }],
        500: [{
            type: "string",
            example: "Failed to delete autorole, are you sure it exists?"
        }]
    },
    comment: 'Deleted autorole'
}

export async function exec(req: Request, res: Response) {
    const role = req.query.role;
    const guild = req.query.guild as string;
    if (!role) return res.status(400).json({ ok: false, error: "Missing required parameter 'role'." });

    try {
        await tools.database.deleteFile(`/autorole/${guild}/${role}.id`);

        return 'Successfully deleted autorole';
    } catch (e) {
        res.status(500).json({ ok: false, error: `Failed to delete autorole, are you sure it exists?` });
    }
}