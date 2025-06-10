import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Add a reward for reaching a certain XP level',
    body: {
        level: {
            type: 'number',
            description: 'The level to trigger the reward',
            required: true
        },
        value: {
            type: 'string',
            description: 'The value of the reward (only role id for now)',
            required: true
        }
    },
    query: null,
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    await tools.database.write(`/xp/${req.query.guild}/rewards/${req.body.level}.reward`, req.body.value);
    return 'success';
}