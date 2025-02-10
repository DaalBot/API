const express = require('express');
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    if (req.headers.botauth !== process.env.BotCommunicationKey) return res.status(401).json({ error: 'Unauthorized' }); // Only allow key generation to the bot
    
    const providedToken = req.headers.authorization;
    if (!providedToken) return res.status(400).json({ error: 'Missing token' });

    if (providedToken.startsWith('Guild ')) {
        const keyData = providedToken.split(' ')[1];
        const guild = Buffer.from(keyData.split('.')[0], 'base64').toString('utf-8');
        const key = keyData.split('.')[1];

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
    }

    // Ask discord for user id
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `Bearer ${providedToken}`
        }
    });

    const id = (await response.json()).id;
    const hashedId = crypto.createHash('sha256').update(id).digest('hex');

    // Hash the bearer token
    const hash = crypto.createHash('sha256');
    hash.update(providedToken);
    const hashedToken = hash.digest('hex');

    // Read the auth file
    let authFile = await fs.readFile(path.resolve('./data/auth.txt'), 'utf-8');

    // Remove the old token
    const lines = authFile.split('\n');
    const newLines = [];
    for (const line of lines) {
        if (line.split(':')[0] !== hashedId) newLines.push(line);
    }

    authFile = newLines.join('\n');

    // Write the new auth file
    await fs.writeFile(path.resolve('./data/auth.txt'), `${authFile == '' ? '' : `${authFile}\n`}${hashedId}:${hashedToken}`); // Append the new token to the file
    /**
     * 37f96542b663971bfdf6b7785174b7255d9aa320fa3455a5b4fa7b079427cf97:[Insert hashed token here i cba to hash a example token]
     * 38934j87wf897837jwv987f8m3w7x987c98w37k9x87m897dj987v8873wc73vwn:[Insert different hashed token here i cba to hash a example token]
    */

    res.status(200).json({ success: true });
}