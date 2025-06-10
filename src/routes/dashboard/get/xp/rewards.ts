import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get all the rewards for a guild',
    body: null,
    query: null,
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    return (await tools.database.readDir(`/xp/${req.query.guild}/rewards`, true)).map((reward) => {
        return {
            level: reward.name.replace('.reward', ''),
            reward: reward.value
        }
    });
}