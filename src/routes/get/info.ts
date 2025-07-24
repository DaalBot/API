import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import { client } from '../../index';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Returns a collection of information from the api (mostly used for badges)',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'Object',
            example: `{
    "status": "online", // always online, this is just for the sake of shields.io not just showing PONG
    "guilds": 85,
    "ping": 42,
}`
        }]
    },
    comment: null
};

let cache = {
    time: 0,
    data: {
        status: '[Error] - Cache not initialized',
        guilds: 0,
        ping: 0
    }
}

export async function exec(req: Request, res: Response) {
    if (cache.time + 5000 < Date.now()) {
        cache.data = {
            status: 'online',
            guilds: client.guilds.cache.size,
            ping: Math.round(client.ws.ping)
        };
        cache.time = Date.now();
    }

    res.header('Cache-Control', 'public, max-age=5');
    res.status(200).json(cache.data);
}