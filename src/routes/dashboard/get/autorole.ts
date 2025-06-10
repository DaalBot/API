import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get the current automatically granted roles',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'Array<string>',
            example: null
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const folder = await tools.database.readDir(`/autorole/${req.query.guild}`);
    return folder.map((file) => {
        return file.name.replace('.id', '');
    });
}