import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';

export const meta: RouteMetadata = {
    description: 'Get all guilds the bot is in (Specific users only)',
    body: null,
    query: null,
    authorization: 'User',
    returns: {},
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

    if (userData.user.id != process.env.OWNER_ID) return res.status(403).json({
        error: 'You are not allowed to access this endpoint'
    });

    const guilds = await Promise.all(
        client.guilds.cache.map(async guild => {
            const owner = await guild.fetchOwner();
            return {
                name: guild.name,
                id: guild.id,
                icon: guild.iconURL(),
                owner: guild.ownerId,
                ownerName: owner.user.username,
                memberCount: guild.memberCount
            };
        })
    );

    return guilds;
}