import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { AxiosError } from 'axios';

export const meta: RouteMetadata = {
    description: 'Get a file from the servers managed storage',
    body: null,
    query: {
        path: {
            description: 'The path of the file to delete (relative to managed guild root)',
            type: 'string',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: null
        }],
        404: [{
            type: 'string',
            example: `File not found`
        }],
        500: [{
            type: 'string',
            example: `Internal server error during file read`
        }, {
            type: 'string',
            example: `Internal server error`
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    // Get the guild ID from the request
    const guild = req.query.guild as string;
    const path = req.query.path as string;
    if (!path) res.status(400).json({ ok: false, error: 'Missing path query parameter' });

    try {
        const fileData = await tools.database.read(`/managed/${guild}/${path}`);

        return fileData;
    } catch (e) {
        if (e instanceof AxiosError) {
            switch (e.response?.data) {
                case 'File Not Found':
                    return res.status(404).json({ ok: false, error: 'File not found' });
                default:
                    res.status(500).json({ ok: false, error: 'Internal server error during file read' });
            }
        } else {
            res.status(500).json({ ok: false, error: 'Internal server error' });
        }

        console.error(e);
    }
}