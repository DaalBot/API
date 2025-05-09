import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import type { CachedGuildData } from '$lib/tools/guildData';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get data for current guild',
    body: null,
    query: {
        filter: {
            description: 'Data to filter by',
            type: "Array<'members' | 'channels' | 'basic' | 'roles'>",
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'object',
            example: null
        }],
        400: [{
            type: 'string',
            example: `Filter must be a (JSON) array`
        }],
        404: [{
            type: 'string',
            example: `Guild not found`
        }],
        500: [{
            type: 'string',
            example: `getGuildData returned null`
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    
    let guildData = (await tools.getUserData({
        accessToken: req.headers.authorization?.split(' ')[1] as string
    }))?.guilds.find((g) => g.id === guild);

    if (!guildData) {
        return res.status(404).json({ ok: false, error: 'Guild not found' });
    }
    if (req.query.basic) return guildData;

    const fullGuildData = await tools.getGuildData({
        guildId: guild,
        accessToken: req.headers.authorization?.split(' ')[1] as string
    });

    if (!fullGuildData) {
        return res.status(500).json({ ok: false, error: 'getGuildData returned null' });
    }

    if (req.query.filter) {
        const filters = JSON.parse(req.query.filter as string) as Array<'members' | 'channels' | 'basic' | 'roles'>;

        if (!Array.isArray(filters))
            return res.status(400).json({ ok: false, error: 'Filter must be a (JSON) array' });

        const filteredGuildData: Partial<CachedGuildData> = {};

        filteredGuildData.id = fullGuildData.id;

        if (filters.includes('members')) filteredGuildData.members = fullGuildData.members;
        if (filters.includes('channels')) filteredGuildData.channels = fullGuildData.channels;
        if (filters.includes('basic')) filteredGuildData.userData = fullGuildData.userData;
        if (filters.includes('roles')) filteredGuildData.roles = fullGuildData.roles;

        return filteredGuildData;
    }

    return fullGuildData;
}