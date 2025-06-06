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
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'number',
            example: '1234'
        }, {
            type: 'Array<{ user: string, xp: number }>',
            example: '[{ user: "123456789012345678", xp: 1234 }]'
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const user = req.query.user;
    const guild = req.query.guild;

    if (!user) {
        const xp = await tools.database.readDir(`/xp/${guild}`, true, true);
        const xpData = xp.map(file => ({
            user: file.name.replace('.xp', ''),
            xp: file.value
        }));
        return xpData;
    }

    const xp = await tools.database.read(`/xp/${guild}/${user}.xp`);

    return xp;
}