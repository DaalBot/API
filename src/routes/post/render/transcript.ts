import type { RouteMetadata } from '$lib/types';
import type { Request, Response } from 'express';
import axios from 'axios';

export const meta: RouteMetadata = {
    description: 'Pass request through to TicketsBot/Discord-chat-replica service (see their docs)',
    body: null,
    query: null,
    authorization: 'None',
    returns: {},
    comment: null
};

export async function exec(req: Request, res: Response) {
    const body = req.body;
    if (!body) return res.status(400).send(`<h1>400 Bad Request (body missing)</h1>`);

    const response = await axios.post('http://localhost:8564', body, {
        headers: {
            'Content-Type': 'application/json'
        }
    })

    if (response.status !== 200) return res.status(500).send(`<h1>500 Internal Server Error (microservice failed)</h1>`);
    res.header('Content-Type', 'text/html');
    res.header('Access-Control-Allow-Origin', '*'); // WHO TF INVENTED CORS I WANNA TALK TO THEM
    res.send(response.data);
}