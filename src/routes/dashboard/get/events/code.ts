import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Read the code of a event',
    body: null,
    query: {
        id: {
            description: 'The ID of the event to get the code of',
            type: 'string',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: null
        }],
        404: [{
            type: 'string',
            example: `Event not found (are you sure you have permission to edit it?)`
        }],
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    try {
        const id = req.query.id as string;
        if (!id) return res.status(400).json({ ok: false, error: 'Missing id query parameter' });

        const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;

        const event = eventsMaster.find(e => (e.id === id && e.guild === req.query.guild));

        if (!event) return res.status(404).json({ ok: false, error: 'Event not found (are you sure you have permission to edit it?)' });

        const file = await tools.database.read(`/events/${id}/event.js`);

        /**
        * File looks like this:
        * 
        * module.exports = {
            name: 'Example Event',
            description: 'Just a description',
            id: 'event-id',
                    
            execute: (async(message, util) => {
        if (message.content == 'ping') {
            message.reply('pong')
        }

        // Whatever other example code
            })
        }
        */

        let code = file;
        const fileLines = file.split('\n');
        const startLine = fileLines.findIndex(line => line.match(/execute:\s*\(async\(.*, util\) => {/));
        const endLine = fileLines.length - 2; // Exclude the last line (closing bracket of the module.exports object)
        
        // Extract the code between the start and end lines
        code = fileLines.slice(startLine + 1, endLine).join('\n');
        // Remove the first line of the code (the async function declaration)
        code = code.replace(/^\s*async\s*\(message, util\) => {\s*/, '');
        // Remove the last line of the code (the closing bracket of the async function)
        code = code.replace(/\s*}\s*$/, '');

        return code;
    } catch (e) {
        console.error(e);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
}