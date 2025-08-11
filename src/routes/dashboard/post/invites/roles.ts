import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Gets data about the roles granted per invite for the server.',
    body: null,
    query: {
        role: {
            type: 'string',
            description: 'The role to link to the invite.',
            required: true
        },
        invite: {
            type: 'string',
            description: 'The invite code to link the role to.',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        400: [
            {
                type: 'string',
                example: 'Role already linked to this invite.'
            },
            {
                type: 'string',
                example: 'Role and invite parameters are required.'
            }
        ],
        200: [
            {
                type: 'string',
                example: 'Success.'
            }
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { guild } = req.query;
    const role = req.query.role as string;
    const invite = req.query.invite as string;

    if (!role || !invite) {
        return res.status(400).json({ok: false, data: 'Role and invite parameters are required.'});
    }

    let roleLinkJSON: { enabled: boolean, links: Record<string, Array<string>> } = {
        enabled: false,
        links: {}
    }

    try {
        // @ts-ignore - This just has bad typing
        roleLinkJSON = await tools.database.read(`/managed/${guild}/roleLinks.json`);
    } catch (error: any) {
        if (error?.message != 'File not found') {
            throw error // Re-throw if it's not a "file not found" error
        }
    }

    if (!roleLinkJSON.links[invite]) {
        roleLinkJSON.links[invite] = [];
    }

    if (!roleLinkJSON.links[invite].includes(role)) {
        roleLinkJSON.links[invite].push(role);
    } else {
        return res.status(400).json({ok: false, data: 'Role already linked to this invite.'});
    }

    await tools.database.write(`/managed/${guild}/roleLinks.json`, JSON.stringify(roleLinkJSON));

    return 'Success.';
}