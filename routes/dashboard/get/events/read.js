require('dotenv').config();
const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const eventId = req.query.id;

    const eventJsonReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`
        }
    })

    const eventJson = eventJsonReq.data;

    const foundEvent = eventJson.find(event => event.id === eventId);
    if (!foundEvent) return res.status(404).send({ error: 'Not Found', message: 'The event you are trying to read does not exist.' });
    if (foundEvent.guild !== req.query.guild) return res.status(403).send({ error: 'Forbidden', message: 'You do not have permission to read this event.' });

    const eventFileReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/${eventId}/event.js`
        }
    });

    // ^ This file will look something like this
    // module.exports = {
    //     name: 'Event Name',
    //     description: 'Event Description',
    //     id: 'event-id',

    //     callback: (async(object, util) => {
    //         // Event code goes here
    //     })
    // }

    /**
     * @type {string}
    */
    const eventFile = eventFileReq.data;
    let response = eventFile;

    // Remove first 6 lines of the file
    for (let i = 0; i < 6; i++) {
        response = response.substring(response.indexOf('\n') + 1);
    }

    // Remove last 2 lines of the file
    for (let i = 0; i < 2; i++) {
        response = response.substring(0, response.lastIndexOf('\n'));
    }
    
    // Send only the event code back to the user
    res.header('Content-Type', 'text/javascript')
    res.send(response)
}