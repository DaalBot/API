import type { RouteMetadata } from '$lib/types';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';

export const meta: RouteMetadata = {
    description: 'Add or override a guild key',
    body: null,
    query: {
        guild: {
            description: 'The guild ID to generate the key for',
            type: 'string',
            required: true
        }
    },
    authorization: 'Locked',
    comment: null
}

export async function exec(req: express.Request, res: express.Response) {
    const trustedKeyStore: { guilds: {id: string, token: string}[], users: {id: string, token: string}[] } = JSON.parse(await fs.readFile(`${process.env.DB_DIR}/auth.json`, 'utf-8'));

    const newKey = req.body.token as string;

    if (!newKey || typeof newKey !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing token in request body' });
    }
    const guildKeyObj = {
        id: crypto.createHash('sha256').update(req.query.guild as string).digest('hex'),
        token: crypto.createHash('sha256').update(newKey).digest('hex')
    }

    let newKeyStore = trustedKeyStore;

    if (newKeyStore.guilds.find((g) => g.id === guildKeyObj.id)) newKeyStore.guilds = newKeyStore.guilds.filter((g) => g.id !== guildKeyObj.id);

    newKeyStore.guilds.push(guildKeyObj);

    await fs.writeFile(`${process.env.DB_DIR}/auth.json`, JSON.stringify(newKeyStore));

    return {
        key: newKey
    };
}