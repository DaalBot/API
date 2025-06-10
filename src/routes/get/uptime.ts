import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { client } from '$app/index';

export const meta: RouteMetadata = {
    description: 'Get the uptime of the client within the API',
    body: null,
    query: null,
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    return client.uptime;
}