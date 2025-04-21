import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Sets the state of a event',
    body: null,
    query: {
        event: {
            type: 'string',
            description: 'The event to set the state of',
            required: true
        },
        state: {
            type: 'boolean',
            description: 'The state to set the event to',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'null',
            example: null
        }],
        400: [{
            type: 'string',
            example: 'Missing event or state query parameter'
        }, {
            type: 'string',
            example: 'State must be \'true\' or \'false\''
        }],
        404: [{
            type: 'string',
            example: 'Event not found'
        }],
        403: [{
            type: 'string',
            example: 'You do not have permission to modify this event'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    const id = req.query.event as string;
    const state = req.query.state as string;

    if (!id || !state) return res.status(400).json({ ok: false, error: 'Missing event or state query parameter' });

    const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;
    
    const event = eventsMaster.find(e => e.id === id);
    if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });

    if (event.guild !== guild) return res.status(403).json({ ok: false, error: 'You do not have permission to modify this event' });
    if (state === 'true') {
        event.enabled = true;
    } else if (state === 'false') {
        event.enabled = false;
    } else {
        return res.status(400).json({ ok: false, error: "State must be 'true' or 'false'" });
    }

    await tools.database.write(`/events/events.json`, JSON.stringify(eventsMaster, null, 4));

    return null;
}