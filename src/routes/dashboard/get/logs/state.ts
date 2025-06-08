import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';
import axios from 'axios';

export const meta: RouteMetadata = {
    description: 'Checks the current state of a gateway event in the logging system',
    body: null,
    query: {
        event: {
            description: 'The event to check the state of',
            type: 'string',
            example: 'messageDelete',
            required: false
        }
    },
    authorization: 'None',
    returns: {
        200: [{
            type: 'boolean',
            example: null
        }, {
            type: 'Array<{ name: string, value: any }>',
            example: null
        }]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const guild = req.query.guild as string;
    const event = req.query.event as string;
    if (!event) {
        const data = await tools.database.readDir(`/logging/${guild}`, true, true);
        return data.filter(i => i.name.endsWith('.enabled')).map((item) => {
            return {
                name: item.name.replace(/\.enabled$/, ''),
                value: item.value
            }
        });
    }

    try {
        const state = await tools.database.read(`/logging/${guild}/${event.toUpperCase()}.enabled`);
        return state;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) { // We don't actually create the event marker until they are enabled so we can safely assume that if it doesn't exist, it is not enabled.
            return false;
        }
    }
}