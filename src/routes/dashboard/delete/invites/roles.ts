import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Deletes a role invite from the server.',
    body: null,
    query: {
        invite: {
            type: 'string',
            description: 'The invite code to unlink',
            required: true
        },
        role: {
            type: 'string',
            description: 'The role to unlink from the invite, if not provided, all roles will be unlinked',
            required: false
        }
    },
    authorization: 'None',
    returns: {
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
    const invite = req.query.invite as string;

    let roleLinkJSON: { enabled: boolean, links: Record<string, Array<string>> } = {
        enabled: false,
        links: {}
    };

    try {
        // @ts-ignore - This just has bad typing
        roleLinkJSON = await tools.database.read(`/managed/${guild}/roleLinks.json`);
    } catch (error: any) {
        if (error?.message != 'File not found') {
            throw error; // Re-throw if it's not a "file not found" error
        }
    }

    if (!roleLinkJSON.links[invite]) {
        return res.status(400).json({ok: false, data: 'Invite not found.'});
    }

    if (req.query.role) {
        const role = req.query.role as string;
        if (!roleLinkJSON.links[invite].includes(role)) {
            return res.status(400).json({ok: false, data: 'Role not linked to this invite.'});
        }
        roleLinkJSON.links[invite] = roleLinkJSON.links[invite].filter(r => r !== role);

        if (roleLinkJSON.links[invite].length === 0) {
            delete roleLinkJSON.links[invite];
        }
    } else {
        delete roleLinkJSON.links[invite];
    }

    await tools.database.write(`/managed/${guild}/roleLinks.json`, JSON.stringify(roleLinkJSON));

    return 'Success.';
}