import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Delete a reward for reaching a certain level',
    body: null,
    query: {
        level: {
            type: 'string',
            description: 'The level of the reward to remove',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'success'
        }]
    },
    comment: 'Deleted XP reward'
};

export async function exec(req: Request, res: Response) {
    const level = req.query.level;
    await tools.database.deleteFile(`/xp/${req.query.guild}/rewards/${level}.reward`);

    return 'success';
}