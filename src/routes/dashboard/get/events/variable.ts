import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Get variables for events by scope',
    body: null,
    query: {
        scope: {
            description: 'The scope of the variable to get',
            type: 'string',
            required: true
        },
        name: {
            description: 'The name of the variable to get',
            type: 'string',
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'Array<{ name: string, value: string }>',
            example: `[{"name":"variable","value":"value"}]`
        }],
        404: [{
            type: 'string',
            example: `Variable not found`
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const scope = req.query.scope as string;
    const name = req.query.name as string;

    const files = await tools.database.readDir(`/events/${scope == 'global' ? req.query.guild : scope}`, true);
    const variables = files.filter(f => f.name != 'event.js').map((file) => {
        return {
            name: file.name.replace('.var', ''),
            value: file.value
        }
    });

    if (name) {
        const variable = variables.find(v => v.name === name);
        if (!variable) return res.status(404).json({ ok: false, error: 'Variable not found' });

        return [variable];
    } else return variables;
}