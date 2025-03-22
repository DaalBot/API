import { RouteMetadata } from "$lib/types";

export const meta: RouteMetadata = {
    description: 'Ping the server',
    body: null,
    query: null,
    authorization: 'None'
}

async function exec() {
    return 'pong';
}