import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Makes a managed db entry',
    body: {
        path: {
            type: 'string',
            description: 'The path to the file to write to',
            required: true
        },
        data: {
            type: 'string',
            description: 'The data to write to the file',
            required: true
        }
    },
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'success'
        }],
        400: [{
            type: 'string',
            example: 'Invalid path'
        }]
    },
    comment: 'wrote a string to a file in the managed db'
};

export async function exec(req: Request, res: Response) {
    const {
        guild
    } = req.query;

    const {
        path,
        data
    } = req.body;

    if (!path || !data) return res.status(400).json({
        error: 'Missing path or data in request body'
    });

    if (path.match(/[^a-zA-Z0-9_\-\/.]/gmi) || path.includes('..')) return res.status(400).json({
        ok: false,
        error: 'Invalid path'
    });

    await tools.database.write(`/managed/${guild}/${path}`, data);

    return 'success';
}