import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Remove a variable from an event',
    body: null,
    query: {
        scope: {
            description: 'The scope of the event. Can be either "global" or a event ID.',
            type: 'string',
            required: true
        },
        name: {
            description: 'The name of the variable to delete.',
            type: 'string',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'success'
        }],
        400: [{
            type: 'string',
            example: 'Missing required parameters.'
        }],
        404: [{
            type: 'string',
            example: 'Event not found.'
        }],
        403: [{
            type: 'string',
            example: 'You do not have permission to modify this event.'
        }],
        500: [{
            type: 'string',
            example: 'Failed to delete variable, are you sure it exists?'
        }]
    },
    comment: 'Deleted event variable'
};

export async function exec(req: Request, res: Response) {
    const { scope, name } = req.query;
    if (!scope || !name) {
        return res.status(400).json({ ok: false, error: 'Missing required parameters.' });
    }

    const guild = req.query.guild as string;

    if (scope != 'global') {
        const file = JSON.parse(await tools.database.read(`/events/events.json`));
        const foundEvent = file.find((event: any) => event.id === scope);

        if (!foundEvent)
            return res.status(404).json({ ok: false, error: 'Event not found.' });

        if (foundEvent.guild !== guild)
            return res.status(403).json({ ok: false, error: 'You do not have permission to modify this event.' });
    }

    const path = `/events/${scope == 'global' ? guild : scope}/${name}.var`;

    try {
        await tools.database.deleteFile(path);
        return 'success';
    } catch (e) {
        return res.status(500).json({ ok: false, error: 'Failed to delete variable, are you sure it exists?' });
    }
}