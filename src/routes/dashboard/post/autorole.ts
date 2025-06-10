import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Adds a new automatically granted role',
    body: null,
    query: {
        role: {
            type: 'string',
            description: 'The role to add',
            required: true
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'success'
        }],
        400: [{
            type: 'string',
            example: 'Role already exists'
        }],
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const role = req.query.role;
    const guild = req.query.guild;

    if (!role) {
        return res.status(400).json({ error: 'Missing role' });
    }

    const existingRoles = await tools.database.readDir(`/autorole/${guild}`);
    if (existingRoles.some((file) => file.name === `${role}.id`)) {
        return res.status(400).json({ error: 'Role already exists' });
    }

    await tools.database.write(`/autorole/${guild}/${role}.id`, role);

    return 'success';
}