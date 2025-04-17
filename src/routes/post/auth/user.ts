import type { RouteMetadata } from '$lib/types';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import tools from '$lib/tools';

export const meta: RouteMetadata = {
    description: 'Add or override a users access token in the database',
    body: {
        token: {
            description: 'The new token to apply to the user',
            type: 'string',
            required: true
        }
    },
    query: null,
    authorization: 'Locked',
    comment: null
}

export async function exec(req: express.Request, res: express.Response) {
    const trustedKeyStore: { guilds: {id: string, token: string}[], users: {id: string, token: string}[] } = JSON.parse(await fs.readFile(`${process.env.DB_DIR}/auth.json`, 'utf-8'));

    if (!req.body.token) return res.status(400).json({ error: 'Missing token' });
    
    const newKey = req.body.token as string;
    const user = await tools.getUserData({
        accessToken: newKey,
    });
    if (!user) return res.status(400).json({ error: 'Invalid token' });

    const userKeyObj = {
        id: crypto.createHash('sha256').update(user.user.id).digest('hex'),
        token: crypto.createHash('sha256').update(newKey).digest('hex')
    }

    let newKeyStore = trustedKeyStore;

    if (newKeyStore.users.find((g) => g.id === userKeyObj.id)) newKeyStore.users = newKeyStore.users.filter((g) => g.id !== userKeyObj.id);

    newKeyStore.users.push(userKeyObj);

    await fs.writeFile(`${process.env.DB_DIR}/auth.json`, JSON.stringify(newKeyStore));

    return 'Success';
}