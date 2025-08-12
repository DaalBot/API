import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';

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
    comment: null,
    rate: {
        window: 10,
        limit: 2
    }
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    const state = req.query.state === 'true';

    let existingInviteTrackingJSON: { enabled: boolean, invites: Array<{code: string, uses: number, creator: string | null; users: Array<string>}> } = {
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

    // Just apply the state as soon as possible
    await tools.database.write(`/managed/${guild}/inviteTracking.json`, JSON.stringify(existingInviteTrackingJSON));

    res.status(200).json({
        ok: true,
        data: 'Success.'
    });

    // Sync invites if enabling tracking (this is less important than the state change so we just do it on our own time)
    if (state) {
        const invites = await client.guilds.cache.get(guild)?.invites.fetch();
        if (invites) {
            invites.forEach(invite => {
                if (!existingInviteTrackingJSON.invites.some(i => i.code === invite.code)) {
                    existingInviteTrackingJSON.invites.push({
                        code: invite.code,
                        uses: invite.uses ?? 0,
                        creator: invite.inviter?.id || null,
                        users: []
                    });
                }
            });

            await tools.database.write(`/managed/${guild}/inviteTracking.json`, JSON.stringify(existingInviteTrackingJSON));
        }
    }
}