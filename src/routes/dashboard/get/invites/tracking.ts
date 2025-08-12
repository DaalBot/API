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
                            creator: 'user1',
                            users: ['user2', 'user3']
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

    try {
        // @ts-ignore - This just has bad typing
        const existingInviteTrackingJSON: { enabled: boolean, invites: Array<{code: string, uses: number, creator: string, users: Array<string>}> } = await tools.database.read(`/managed/${guild}/inviteTracking.json`);

        return existingInviteTrackingJSON;
    } catch (error: any) {
        if (error?.message === 'File not found') {
            return {
                enabled: false,
                invites: []
            };
        } else {
            throw error; // Re-throw if it's not a "file not found" error
        }
    }
}