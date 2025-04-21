import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Change a value of a variable in a event scope',
    body: {
        data: {
            type: 'string',
            description: 'The value to set',
            required: true
        }
    },
    query: {
        scope: {
            type: "'global' | '[EVENT_ID]'",
            description: 'The scope of the variable to modify',
            required: true
        },
        name: {
            type: 'string',
            description: 'The name of the variable to modify',
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
            example: 'Missing scope, name or data'
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
    const { scope, name } = req.query;
    const { data } = req.body;

    if (!scope || !name || !data) {
        return res.status(400).json({ error: 'Missing scope, name or data' });
    }

    if (scope != 'global') {
        const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;
        const event = eventsMaster.find(e => e.id === scope);
        if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });
        if (event.guild !== req.query.guild) return res.status(403).json({ ok: false, error: 'You do not have permission to modify this event' });
    }

    const path = `/events/${scope == 'global' ? req.query.guild : scope}/variables/${name}.var`;

    await tools.database.write(path, data);

    return null;
}