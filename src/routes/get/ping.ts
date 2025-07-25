import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Checks if the server is alive',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'pong'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    return 'pong';
}