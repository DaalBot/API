import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';

export const meta: RouteMetadata = {
    description: 'Get mutual guilds between the bot and the current user.',
    body: null,
    query: null,
    authorization: 'User',
    returns: {
        200: [
            {
                type: "Array<string>",
                example: '["GUILD_ID","GUILD_ID"]'
            }
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const userData = await tools.getUserData({
        accessToken: req.headers.authorization?.split(' ')[1]
    });
    if (!userData) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }

    const guilds = userData.guilds;

    const mutualGuilds = [];

    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        if (client.guilds.cache.has(guild.id)) {
            mutualGuilds.push(guild.id);
        }
    }

    return mutualGuilds;
}
