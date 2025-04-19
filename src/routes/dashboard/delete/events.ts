import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Deletes a event given the event ID',
    body: null,
    query: {
        id: {
            description: 'The event ID to delete',
            type: 'string',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'Successfully deleted event'
        }],
        400: [{
            type: 'string',
            example: 'Missing required parameter \'event\'.'
        }],
        404: [{
            type: 'string',
            example: 'Event not found'
        }],
    },
    comment: 'Deleted event'
};

export async function exec(req: Request, res: Response) {
    const id = req.query.id;
    if (!id) return res.status(400).json({ ok: false, error: "Missing required parameter 'event'." });

    const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;

    const event = eventsMaster.find(e => e.id === id);
    if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });

    eventsMaster.splice(eventsMaster.indexOf(event), 1);

    await tools.database.write(`/events/events.json`, JSON.stringify(eventsMaster, null, 4));

    return 'Successfully deleted event';
}