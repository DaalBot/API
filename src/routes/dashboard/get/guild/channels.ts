import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get the channels of current guild',
    body: null,
    query: null,
    authorization: 'None',
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    
    return await tools.getGuildData({
        guildId: guild,
        accessToken: req.headers.authorization?.split(' ')[1] as string
    });
}