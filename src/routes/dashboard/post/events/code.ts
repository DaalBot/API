import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Modifies the code of a event.',
    body: {
        data: {
            type: 'string',
            description: 'The code to write',
            required: true
        }
    },
    query: {
        id: {
            type: 'string',
            description: 'The id of the event to modify',
            required: true
        }
    },
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    if (!req.query.id) return res.status(400).json({ error: 'Missing id' });
    if (!req.body.data) return res.status(400).json({ error: 'Missing data' });

    const inputFileContents = req.body.data as string;

    const eventId = req.query.id as string;
    const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;
    const event = eventsMaster.find(e => e.id === eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.guild !== req.query.guild) return res.status(403).json({ error: 'You do not have permission to modify this event' });

    const existingEventFile = await tools.database.read(`/events/${eventId}/event.js`) as string;
    const existingEventCode = existingEventFile.split(/execute: \(async\(.*, util\) => {/)[1].split('\n').slice(0, -2).join('\n');

    const newEventFile = existingEventFile.replace(existingEventCode, `\n${inputFileContents}`); // Newline stops code from being on the same line as the function
    await tools.database.write(`/events/${eventId}/event.js`, `${newEventFile}`);

    return 'success';
}