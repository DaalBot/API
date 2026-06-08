import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Sets a users XP (1000 XP = 1 level)',
    body: null,
    query: {
        user: {
            type: 'string',
            description: 'The user to set the XP for',
            required: true
        },
        xp: {
            type: 'number',
            description: 'The amount of XP to set the user to',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'Success.'
        }]
    },
    comment: 'set the XP of a user'
};

export async function exec(req: Request, res: Response) {
    if (!req.query.user) return res.status(400).json({ error: 'Missing user' });
    if (!req.query.xp) return res.status(400).json({ error: 'Missing xp' });

    const user = req.query.user as string;
    const xp = req.query.xp as string;

    await tools.database.write(`/xp/${req.query.guild}/${user}.xp`.trim(), xp);

    res.status(200).json({ ok: true, data: 'Success.' });
}