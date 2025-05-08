import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import { execSync } from 'child_process';

export const meta: RouteMetadata = {
    description: 'Update and restart the API to the latest commit.',
    body: null,
    query: null,
    authorization: 'CI',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    execSync('sh update.sh');
    res.send({ // Ensure CI flow doesnt fail due to timeout
        ok: true,
        data: 'Updated'
    });

    execSync('pm2 restart 1');
}