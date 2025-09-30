import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import fs from 'fs';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Creates a new event',
    body: null,
    query: {
        on: {
            type: 'string',
            description: 'The event to listen to',
            required: true
        },
        name: {
            type: 'string',
            description: 'The name of the event',
            required: true
        },
        description: {
            type: 'string',
            description: 'The description of the event',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'object',
            example: `{
                id: '123456789012345678',
                guild: '123456789012345678',
                on: 'messageCreate',
                name: 'My Event',
                description: 'This is my event',
                enabled: true
            }`
        }],
        400: [{
            type: 'string',
            example: 'Missing required parameters'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const validOnValues = JSON.parse(fs.readFileSync(`${process.env.DB_DIR}/config/events.json.public`, 'utf-8')).event_types.map((e: { value: any; }) => e.value); // Bit slow but it works
    if (!validOnValues.includes(req.query.on)) {
        return res.status(400).send({
            error: 'Invalid on value'
        });
    }

    async function id_generatestring(length = 32) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
    
        // Default settings: 2.08592483976E93 possible combinations [length ^ 62 (< charset length)]
        
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
    
        return result.replace(/\B(?=(.{5})+(?!.))/g, '-');
    }

    const id = await id_generatestring(16);

    if (!req.query.on || !req.query.name || !req.query.description) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const eventObj = {
        id: id,
        guild: req.query.guild as string,
        on: req.query.on as string,
        name: req.query.name as string,
        description: req.query.description as string,
        enabled: true // Default to true
    }

    const eventsMaster = await tools.database.read(`/events/events.json`) as unknown as Array<{ id: string, name: string, description: string, on: string, guild: string, enabled: boolean }>;
    eventsMaster.push(eventObj);

    let objectName = (req.query.on as string).replace('Create', '').replace('Update', '').replace('Delete', '').replace('Add', '').replace('Remove', '').toLowerCase();

    switch (objectName) {
        case 'guildmember':
            objectName = 'member';
            break;
        case 'guildban':
            objectName = 'ban';
            break;
        case 'guildwarn':
            objectName = 'warn';
            break;
        case 'guildrole':
            objectName = 'role';
            break;
        default:
            break;
    }

    const eventFile = `module.exports = {
    name: '${req.query.name}',
    description: '${req.query.description}',
    id: '${id}',
        
    execute: (async(${objectName}, util) => {
// To learn more visit https://lnk.daalbot.xyz/EventsGuide
    })
}`;

    await tools.database.createDir(`/events/${id}`);
    await tools.database.write(`/events/${id}/event.js`, eventFile);
    await tools.database.write(`/events/events.json`, JSON.stringify(eventsMaster, null, 4));

    return eventObj;
}