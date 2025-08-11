import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Toggles invite tracking for the server.',
    body: null,
    query: {
        state: {
            type: 'boolean',
            description: 'The state to set for the invite tracking system.',
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
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { guild } = req.query;
    const state = req.query.state === 'true';

    let existingInviteTrackingJSON: { enabled: boolean, invites: Array<{code: string, uses: number, users: Array<string>}> } = {
        enabled: false,
        invites: []
    };

    try {
        // @ts-ignore - This just has bad typing
        existingInviteTrackingJSON = await tools.database.read(`/managed/${guild}/inviteTracking.json`);
    } catch (error: any) {
        if (error?.message != 'File not found') {
            throw error; // Re-throw if it's not a "file not found" error
        }
    }

    existingInviteTrackingJSON.enabled = state;

    await tools.database.write(`/managed/${guild}/inviteTracking.json`, JSON.stringify(existingInviteTrackingJSON));

    return 'Success.';
}