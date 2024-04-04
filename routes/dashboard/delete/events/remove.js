const axios = require('axios');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
*/
module.exports = async (req, res) => {
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

    if (!foundEvent) {
        return res.status(404).send({
            error: 'Event not found'
        });
    }

    // Check if the event is owned by the guild being managed
    if (foundEvent.guild !== req.query.guild) {
        return res.status(403).send({
            error: 'Forbidden - Event does not belong to the current guild.'
        });
    }

    eventJson.splice(eventJson.indexOf(foundEvent), 1);

    await axios.post(`https://bot.daalbot.xyz/post/database/create?enc=1`,{}, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`,
            'data': encodeURIComponent(JSON.stringify(eventJson, null, 4)),
            'type': 'file'
        }
    });

    res.status(200).send({
        success: 'Event removed successfully'
    });
}