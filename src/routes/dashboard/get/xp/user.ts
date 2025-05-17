import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Gets the current XP for a member',
    body: null,
    query: {
        user: {
            type: 'string',
            description: 'The user to get the XP for',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'number',
            example: '1234'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const user = req.query.user;
    const guild = req.query.guild;

    if (!user) {
        return res.status(400).json({ error: 'Missing user' });
    }

    const xp = await tools.database.read(`/xp/${guild}/${user}.xp`);

    return xp;
}