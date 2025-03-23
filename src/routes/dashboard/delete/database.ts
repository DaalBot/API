import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Delete a item from managed storage',
    body: null,
    query: {
        path: {
            description: 'The path of the file to delete (relative to guild root)',
            type: 'string',
            required: false
        }
    },
    authorization: 'None'
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    const path = req.query.path;
    if (!path) res.status(400).json({ ok: false, error: 'Missing path query parameter' });

    // Send off the request to delete the file
    const result = await tools.database.deleteFile(`/managed/${guild}/${path}`);
    
    return result;
}