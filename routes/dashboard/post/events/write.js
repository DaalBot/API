const express = require('express');
const axios = require('axios');
require('dotenv').config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const eventId = req.query.id;
    let data = decodeURIComponent(req.query.data ?? '');

    // If no data is provided in the query, check the body (newer method but defaults gotta remain)
    if (!data) data = req.body.data;
    if (!data) return res.status(400).send({ error: 'Bad Request', message: 'No data provided' });

    const inputFileContents = data;

    // Check if the code is allowed (Should be done on the client side as well, but just in case it isnt done there, we do it here as well)
    const checks = require('../../../../checks.js');

    let allowed = await checks.security.checkEventSecurity(inputFileContents);
    if (!allowed) return res.status(403).send({ error: 'Forbidden', message: 'The code you are trying to write is not allowed.' });

    const eventJsonReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`
        }
    })

    const eventJson = eventJsonReq.data;

    const foundEvent = eventJson.find(event => event.id === eventId);
    if (!foundEvent) return res.status(404).send({ error: 'Not Found', message: 'The event you are trying to write to does not exist.' });
    if (foundEvent.guild !== req.query.guild) return res.status(403).send({ error: 'Forbidden', message: 'You do not have permission to write to this event.' });

    const existingEventFileReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/${eventId}/event.js`
        }
    });

    const existingEventFile = existingEventFileReq.data;
    let existingCode = existingEventFile;

    // Remove first 6 lines of the file
    for (let i = 0; i < 6; i++) {
        existingCode = existingCode.substring(existingCode.indexOf('\n') + 1);
    }

    // Remove last 2 lines of the file
    for (let i = 0; i < 2; i++) {
        existingCode = existingCode.substring(0, existingCode.lastIndexOf('\n'));
    }

    let eventCode = existingEventFile.replace(existingCode, inputFileContents);

    
    await axios.post(`https://bot.daalbot.xyz/post/database/create?enc=1`,{
        data: eventCode
    }, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/${eventId}/event.js`,
            'type': 'file'
        }
    });

    res.status(200).send({ message: 'Event written successfully' });
}