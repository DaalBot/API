const axios = require('axios');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
*/
module.exports = async (req, res) => {
    const eventId = req.query.id;
    const state = req.query.state;

    const eventJsonReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`
        }
    })

    const eventJson = eventJsonReq.data;

    const foundEvent = eventJson.find(event => event.id === eventId);

    if (!foundEvent) {
        return res.status(404).send({
            error: 'Event not found'
        });
    }

    foundEvent.enabled = state === 'true';

    await axios.post(`https://bot.daalbot.xyz/post/database/create`,{
        data: JSON.stringify(eventJson, null, 4)
    }, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`,
            'type': 'file'
        }
    });

    res.status(200).send({
        success: 'Event toggled successfully'
    });
}