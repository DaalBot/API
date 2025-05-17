import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Gets the current channel logs are sent to',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: null
        }]
    },
    comment: null,
};

export async function exec(req: Request, res: Response) {
    return `${await tools.database.read(`/logging/${req.query.guild}/channel.id`)}`;
}