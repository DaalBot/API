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
    const result = data.filter(i => i.name.endsWith('.enabled')).map(item => ({
      name: item.name.replace(/\.enabled$/, ''),
      value: item.value
    }));

    return res.json({ ok: true, data: result });
  }

  try {
    const state = await tools.database.read(`/logging/${guild}/${event.toUpperCase()}.enabled`);
    return res.json({ ok: true, data: state });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.json({ ok: true, data: false });
    }
    // Log or return error explicitly:
    console.error('Error in /dashboard/logs/state:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}