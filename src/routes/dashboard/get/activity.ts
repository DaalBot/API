import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export const meta: RouteMetadata = {
    description: 'Get the latest actions performed through the API for the server. (excl. GET Requests)',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: `Array<{ method: string, route: string, ts: number, executor: string, comment: string }>`,
            example: JSON.stringify([{"method":"POST","route":"/dashboard/xp/reward","ts":1234567890,"executor":"123456789012345678","comment":"Added XP reward"}])
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    return JSON.parse(existsSync(`${process.env.DB_DIR}/activity/${req.query.guild}.json`) ? await fs.readFile(`${process.env.DB_DIR}/activity/${req.query.guild}.json`, 'utf-8') : '[]');
}