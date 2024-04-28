const express = require('express');
const axios = require('axios');
require('dotenv').config();
const client = require('../../../../client.js');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;
    const scope = req.query.scope; // 'global' or event id
    const varName = req.query.var; // If defined get variable data otherwise return list of variable names

    if (!scope) return res.status(400).send({ error: 'Bad Request', message: 'Missing required parameters.' });

    const varFolder = scope === 'global' ? `events/${guild}` : `events/${scope}`;

    if (scope != 'global') {
        const eventJsonReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/events/events.json`
            }
        })
    
        const eventJson = eventJsonReq.data;
    
        const foundEvent = eventJson.find(event => event.id === scope);

        if (!foundEvent) return res.status(404).send({ error: 'Not Found', message: 'The event you are access to read does not exist.' });
        if (foundEvent.guild !== guild) return res.status(403).send({ error: 'Forbidden', message: 'You do not have permission to access this event.' });
    }

    if (varName) {
        const varFileReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/${varFolder}/${varName}.var`
            }
        });

        const varFile = varFileReq.data;

        return res.send(varFile);
    } else {
        const varFilesReq = await axios.get(`https://bot.daalbot.xyz/get/database/readDir`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/${varFolder}`
            }
        });

        const varFiles = varFilesReq.data;

        return res.send(varFiles);
    }
}