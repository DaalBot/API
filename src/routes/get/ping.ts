import { RouteMetadata } from "$lib/types";

export const meta: RouteMetadata = {
    description: 'Ping the server',
    body: null,
    query: null,
    authorization: 'None',
    returns: {
        200: [{
            type: 'string',
            example: 'Pong!'
        }]
    },
    comment: null
}

export async function exec(req: Request, res: Response) {
    return 'Pong!';
}