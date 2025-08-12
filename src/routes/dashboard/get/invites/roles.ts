import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Gets data about the roles granted per invite for the server.',
    body: null,
    query: {},
    authorization: 'None',
    returns: {
        200: [
            {
                type: '{ enabled: boolean, links: Record<string, Array<string>> }',
                example: JSON.stringify({
                    enabled: true,
                    links: {
                        'inviteCode': ['role1', 'role2']
                    }
                })
            }
        ]
    },
    comment: null
};

export async function exec(req: Request, res: Response) {
    const { guild } = req.query;

    try {
        // @ts-ignore - This just has bad typing
        const roleLinkJSON: { enabled: boolean, links: Record<string, Array<string>> } = await tools.database.read(`/managed/${guild}/roleLinks.json`);

        return roleLinkJSON;
    } catch (error: any) {
        if (error.message === 'File not found') {
            return {
                enabled: false,
                links: {}
            }
        } else throw error;
    }
}