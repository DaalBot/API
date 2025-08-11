import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Toggle whether or not role invites should be enabled.',
    body: null,
    query: {
        state: {
            type: 'boolean',
            description: 'Whether the role is enabled for the invite.',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [
            {
                type: 'string',
                example: 'Success.'
            }
        ],
        400: [
            {
                type: 'string',
                example: 'State parameter must be true or false.'
            }
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { guild } = req.query;
    const state = req.query.state as string;

    if (state !== 'true' && state !== 'false') {
        return res.status(400).json({ok: false, data: 'State parameter must be true or false.'});
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

    roleLinkJSON.enabled = state === 'true';

    await tools.database.write(`/managed/${guild}/roleLinks.json`, JSON.stringify(roleLinkJSON));

    return 'Success.';
}