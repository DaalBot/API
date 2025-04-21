import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Modifies a config value',
    body: null,
    query: {
        category: {
            type: 'string',
            description: 'The category of the config to modify',
            required: true
        },
        key: {
            type: 'string',
            description: 'The key of the config to modify',
            required: true
        },
        value: {
            type: 'string',
            description: 'The value to set',
            required: true
        }
    },
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { category, key, value } = req.query;

    if (!category || !key || !value) {
        return res.status(400).json({ error: 'Missing category, key or value' });
    }

    await tools.database.write(`/config/${req.query.guild}/${category}/${key}.id`, value);

    return null;
}