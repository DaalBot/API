import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Sets the channel that events will be logged to',
    body: null,
    query: {
        channel: {
            type: 'string',
            description: 'The ID of the channel to log events to',
            required: true
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
    const channel = req.query.channel as string;
    const guild = req.query.guild as string;

    if (!channel) {
        return res.status(400).json({ error: 'Missing channel query parameter' });
    }

    try {
        await tools.database.write(`/logging/${guild}/channel.id`, channel);
    } catch (e) {
        console.error(`[${Date.now().toString()}] Write failed`, e);
    }

    res.status(200).json({ ok: true, data: 'Success.' });
}