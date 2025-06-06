import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';
import { ChannelType } from 'discord-api-types/v10';
import { TextChannel, Webhook } from 'discord.js';

const disallowedTypes = [
    ChannelType.GuildCategory,
    ChannelType.DM,
    ChannelType.GroupDM
]

export const meta: RouteMetadata = {
    description: 'Sends a message to a specific channel',
    body: {
        data: {
            type: 'string',
            description: 'The message payload to send (discord.js message object)',
            required: true
        },
        webhook: {
            type: 'Object',
            description: 'The webhook author details (uses any webhook owned by the bot, if none found returns an error)',
            required: false,
            example: `{"name": "Webhook Name","avatar": "https://example.com/avatar.png"}`
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
            description: 'If specified, the provided message will be either replied to or edited',
            required: false
        },
        mode: {
            type: `'reply' | 'edit'`,
            description: 'The mode to use when sending the message (reply or edit)',
            required: false,
            example: 'reply'
        }
    },
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    if (!req.query.channel) return res.status(400).json({ error: 'Missing channel' });
    if (!req.body.data) return res.status(400).json({ error: 'Missing data' });

    const channel = client.channels.cache.get(req.query.channel as string) as TextChannel; // Doesn't have to be a text channel but most methods work with other types
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (disallowedTypes.includes(channel.type)) return res.status(400).json({ error: 'Channel type not allowed' });

    let sender: TextChannel | Webhook = channel;

    if (req.body.webhook) {
        const webhook = req.body.webhook as { name: string; avatarURL: string };
        if (!webhook.name) return res.status(400).json({ error: 'Missing webhook name' });
        if (!webhook.avatarURL || !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/.test(webhook.avatarURL)) return res.status(400).json({ error: 'Invalid webhook avatarURL URL' });
        if (webhook.name && webhook.name.length > 80) return res.status(400).json({ error: 'Webhook name is too long' });

        const webhooks = await channel.fetchWebhooks();
        const webhookToUse = webhooks.find(w => w.owner?.id === client.user?.id);
        if (!webhookToUse) return res.status(424).json({ error: 'No webhook found' });

        sender = webhookToUse;
    }

    const messageData = req.body.data;

    if (req.query.id) {
        const messageId = req.query.id as string;
        const message = await channel.messages.fetch(messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (req.query.mode === 'reply') { // TODO: Make these work with webhooks
            await message.reply(messageData);
        } else if (req.query.mode === 'edit') {
            if (message.author.id !== client.user?.id) return res.status(403).json({ error: 'You cannot edit this message' });

            await message.edit(messageData);
        } else {
            return res.status(400).json({ error: 'Invalid mode / No mode selected' });
        }
    } else {
        if (sender instanceof Webhook) {
            await sender.send({
                ...messageData,
                ...req.body.webhook
            });
        } else {
            await sender.send(messageData);
        }
    }

    return 'success';
}