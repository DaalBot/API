import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';
import axios from 'axios';

export const meta: RouteMetadata = {
    description: 'Get statistics and analytics collected by the bot',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'object',
            example: `{
    message_counts: {
        month: number,
        day: number,
        lifetime: number
    },
    bot: {
        user_count: number,
        guild_count: number,
        channel_count: number,
    },
    resType: 'fresh' | 'cached'
}`
        }]
    },
    comment: null
};

let cachedOutput = {
    addedAt: -1,
    data: {
        resType: 'no-data',
        message_counts: {
            month: 0,
            day: 0,
            lifetime: 0
        },
        bot: {
            user_count: 0,
            guild_count: 0,
            channel_count: 0
        }
    }
}

export async function exec(req: Request, res: Response) {
    if (cachedOutput.addedAt + 1000 *  5 > Date.now())
        return {
            ...cachedOutput.data,
            resType: 'cached'
        };

    const basketRes = await axios.get(`https://getpantry.cloud/apiv1/pantry/${process.env.PANTRY_ID}/basket/analytics${process.env.DEV == '1' ? '' : ''}`);

    if (basketRes.status !== 200) {
        return {
            message_counts: {
                month: 0,
                day: 0,
                lifetime: 0
            },
            bot: {
                user_count: 0,
                guild_count: 0,
                channel_count: 0
            },
            resType: 'no-data'
        };
    }

    const data = basketRes.data;
    let messages = data.messages;

    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;
    messages = messages.filter((msg: number) => {now - msg < oneDay}); // filter messages from the last 24 hours

    const history = data.history || {};
    let monthTotal = 0;

    for (let i = 0; i < 30; i++) {
        const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - i;
        
        if (history[daysSinceEpoch]) monthTotal += history[daysSinceEpoch];
        else break;
    }

    cachedOutput = {
        addedAt: Date.now(),
        data: {
            message_counts: {
                'month': monthTotal ?? 0,
                'day': data.messages.length ?? 0,
                'lifetime': data.totalMessages ?? 0
            },
            bot: {
                user_count: client.users.cache.size ?? -1,
                channel_count: client.channels.cache.size ?? -1,
                guild_count: client.guilds.cache.size ?? -1,
            },
            resType: 'fresh'
        }
    }

    return cachedOutput.data;
}