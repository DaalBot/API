const express = require('express');
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs').promises;
const { existsSync } = require('fs');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    if (req.headers.botauth !== process.env.BotCommunicationKey) return res.status(401).json({ error: 'Unauthorized' }); // Only allow key generation to the bot
    
    const providedToken = req.headers.authorization;
    if (!providedToken) return res.status(400).json({ error: 'Missing token' });

    const guild = Buffer.from(providedToken.split('.')[0], 'base64').toString('utf-8');
    const key = providedToken.split('.')[1];

    const hashedGuild = crypto.createHash('sha256').update(guild).digest('hex');
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');

    if (!existsSync('./data/guild.keys')) await fs.writeFile('./data/guild.keys', '', {
        flag: 'w'
    });

    const keys = (await fs.readFile('./data/guild.keys', 'utf-8')).split('\n');
    let newKeys = [];
    if (!keys.find(k => k.startsWith(hashedGuild))) { // If the guild is not in the keys
        newKeys = keys.filter(k => !k.startsWith(hashedGuild)); // Remove all keys for the guild
        newKeys.push(`${hashedGuild}:${hashedKey}`); // Add the new key
    } else {
        newKeys = keys.map(k => k.startsWith(hashedGuild) ? `${hashedGuild}:${hashedKey}` : k); // Replace the key
    }

    await fs.writeFile('./data/guild.keys', newKeys.join('\n'), {
        flag: 'w'
    });

    res.status(200).json({ success: true });
}