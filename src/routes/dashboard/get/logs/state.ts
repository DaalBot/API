import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Checks the current state of a gateway event in the logging system',
    body: null,
    query: {
        event: {
            description: 'The event to check the state of',
            type: 'string',
            example: 'messageDelete',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'boolean',
            example: null
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    const event = req.query.event as string;
    if (!event) return res.status(400).json({ ok: false, error: 'Missing event query parameter' });

    const state = await tools.database.read(`/logging/${guild}/${event.toUpperCase()}.enabled`);
    return state;
}