import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';

export const meta: RouteMetadata = {
    description: 'Test if the current auth token is valid',
    body: {},
    query: null,
    authorization: 'None'
};

export async function exec(req: Request, res: Response) {
    return 'Pong!';
}