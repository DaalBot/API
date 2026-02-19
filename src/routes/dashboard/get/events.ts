import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get events from the current server',
    body: null,
    query: {
        id: {
            description: 'The ID of the event to get data on',
            type: 'string',
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>',
            example: `[{"id":"x-xxxxx-xxxxx-xxxxx","guild":"[Guild ID]","on":"messageCreate","name":"Dummy event","description":"This is a dummy event","enabled":true}]`
        }],
        404: [{
            type: 'string',
            example: `Event not found`
        }],
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const id = req.query.id;

    let eventsMasterResult: string | object = await tools.database.read(`/events/events.json`);
    console.log(eventsMasterResult);
    if (typeof eventsMasterResult === 'object') {
        eventsMasterResult = JSON.stringify(eventsMasterResult);
    }
    console.log(eventsMasterResult);
    let eventsMaster = JSON.parse(eventsMasterResult) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;
    console.log(JSON.stringify(eventsMaster));
    eventsMaster = eventsMaster.filter(e => e.guild === req.query.guild);
    if (eventsMaster.length === 0) return res.status(404).json({ ok: false, error: 'Event not found' });

    if (id) {
        const event = eventsMaster.find(e => e.id === id);
        if (!event) return res.status(404).json({ ok: false, error: 'Event not found' });

        return event;
    } else return eventsMaster;
}