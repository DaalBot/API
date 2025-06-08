import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Changes the state of a gateway events logging',
    body: null,
    query: {
        event: {
            type: 'string',
            description: 'The gateway event to change the state of',
            required: true,
            example: 'guildMemberAdd'
        },
        state: {
            type: 'boolean',
            description: 'The new state of the event logging',
            required: true,
            example: 'true'
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'Success.'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const event = req.query.event as string;
    const state = req.query.state as string;
    const guild = req.query.guild as string;

    if (!event || !state) {
        return res.status(400).json({ error: 'Missing event or state query parameter' });
    }
    if (state !== 'true' && state !== 'false') {
        return res.status(400).json({ error: 'State must be \'true\' or \'false\'' });
    }

    await tools.database.write(`/logging/${guild}/${event.toUpperCase()}.enabled`, state === 'true' ? 'true' : 'false');
    return 'Success.';
}