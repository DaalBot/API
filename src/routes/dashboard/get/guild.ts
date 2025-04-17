import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get data for current guild',
    body: null,
    query: {
        basic: {
            description: 'Whether to only include basic data such as name, icon, and id',
            type: 'boolean',
            required: false
        }
    },
    authorization: 'None',
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

    return fullGuildData;
}