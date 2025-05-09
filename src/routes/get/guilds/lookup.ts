import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';

export const meta: RouteMetadata = {
    description: 'Lookup a guild by its ID (Specific users only)',
    body: null,
    query: {
        guild: {
            type: 'string',
            description: 'The ID of the guild to lookup',
            required: true
        }
    },
    authorization: 'User',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild;
    if (!guild) {
        return res.status(400).json({
            error: 'Guild ID is required'
        });
    }

    const guildObj = client.guilds.cache.get(guild as string);

    if (!guildObj) {
        return res.status(404).json({
            error: 'Guild not found'
        });
    }

    guildObj.fetchOwner().then(owner => {
        res.json({ok: true, data: {
            name: guildObj.name,
            id: guildObj.id,
            roles: guildObj.roles.cache.map(role => role.id),
            owner: guildObj.ownerId,
            ownerName: owner.user.username,
            ownerAvatar: owner.user.displayAvatarURL(),
            memberCount: guildObj.memberCount,
            icon: guildObj.iconURL(),
            channels: guildObj.channels.cache.map(channel => {
                return {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    parent: channel.parent ? channel.parent.id : null
                }
            }),
            emojis: guildObj.emojis.cache.map(emoji => {
                return {
                    id: emoji.id,
                    name: emoji.name,
                    url: emoji.url
                }
            }),
        }})
    })
}