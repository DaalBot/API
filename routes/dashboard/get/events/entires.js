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

    const events = eventJson.filter(event => event.guild === req.query.guild);

    if (eventId) {
        const event = events.find(event => event.id === eventId);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        return res.json(event);
    }

    return res.json(events);
}