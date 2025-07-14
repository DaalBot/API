import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';
import { ChannelType } from 'discord-api-types/v10';
import { TextChannel, Webhook } from 'discord.js';
import axios from 'axios';

const disallowedTypes = [
    ChannelType.GuildCategory,
    ChannelType.DM,
    ChannelType.GroupDM
]

export const meta: RouteMetadata = {
    description: 'Sends a message to a specific channel',
    body: {
        data: {
            type: 'MessagePayload',
            description: 'The message payload to send (discord.js message object)',
            required: true
        }
    },
    query: {
        channel: {
            type: 'string',
            description: 'The channel to send the message to',
            required: true
        },
        id: {
            type: 'string',
            description: 'The ID of the message to edit (use message_reference if you want to reply to a message)',
            required: false
        },
        webhook: {
            type: 'string',
            description: 'The ID of the webhook to use for sending the message (/webhook list)',
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'success'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    if (!req.query.channel) return res.status(400).json({ error: 'Missing channel' });
    if (!req.body.data) return res.status(400).json({ error: 'Missing data' });

    const channel = client.channels.cache.get(req.query.channel as string) as TextChannel; // Doesn't have to be a text channel but most methods work with other types
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (disallowedTypes.includes(channel.type)) return res.status(400).json({ error: 'Channel type not allowed' });

    if (!req.query.webhook && !req.query.id) {
        await axios.post(`https://discord.com/api/v10/channels/${channel.id}/messages`, req.body.data, { // Discord.JS behaves weirdly with Components V2 when inputting JSON??
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });
        return 'success';
    }

    let baseURL = `https://discord.com/api/v10/channels/${channel.id}`;
    if (req.query.webhook) {
        const webhooks = await channel.fetchWebhooks();
        
        const webhook = webhooks.get(req.query.webhook as string);
        if (!webhook) return res.status(404).json({ error: 'Webhook not found' });

        baseURL = webhook.url;

        if (!req.query.id) {
            await axios.post(`${baseURL}`, req.body.data, {
                headers: {
                    'Authorization': `Bot ${process.env.TOKEN}`
                }
            });
        }
    }

    if (req.query.id) {
        await axios.patch(`${baseURL}/messages/${req.query.id}`, req.body.data, {
            headers: {
                'Authorization': `Bot ${process.env.TOKEN}`
            }
        });
    }

    return 'success';
}