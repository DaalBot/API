import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Gets invite tracking data for the server.',
    body: null,
    query: {},
    authorization: 'None',
    returns: {
        200: [
            {
                type: '{ enabled: boolean, invites: Array<{code: string, uses: number, users: Array<string>}> }',
                example: JSON.stringify({
                    enabled: true,
                    invites: [
                        {
                            code: 'inviteCode',
                            uses: 10,
                            users: ['user1', 'user2']
                        }
                    ]
                })
            }
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { guild } = req.query;

    // @ts-ignore - This just has bad typing
    const existingInviteTrackingJSON: { enabled: boolean, invites: Array<{code: string, uses: number, users: Array<string>}> } = await tools.database.read(`/managed/${guild}/inviteTracking.json`);

    return existingInviteTrackingJSON;
}