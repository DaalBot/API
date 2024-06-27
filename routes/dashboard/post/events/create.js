const axios = require('axios');
const tools = require('../../../../tools.js');
const express = require('express');
const fs = require('fs');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = async (req, res) => {
    const validOnValues = JSON.parse(fs.readFileSync('./config/events.json.public', 'utf-8')).event_types.map(e => e.value); // Bit slow but it works
    if (!validOnValues.includes(req.query.on)) {
        return res.status(400).send({
            error: 'Invalid on value'
        });
    }
    const id = await tools.id_generatestring(16)

    const name = req.query.name;

    const eventObj = {
        id: id,
        guild: req.query.guild,
        on: req.query.on,
        name: name,
        description: req.query.description,
        enabled: true // Default to true
    }

    const eventJsonReq = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/events.json`
        }
    });

    const eventJson = eventJsonReq.data;

    eventJson.push(eventObj);

    let objectName = req.query.on.replace('Create', '').replace('Update', '').replace('Delete', '').replace('Add', '').replace('Remove', '').toLowerCase();

    switch (objectName) {
        case 'guildmember':
            objectName = 'member';
            break;
        case 'guildban':
            objectName = 'ban';
            break;
        default:
            break;
        }

    const eventFile = `module.exports = {
    name: '${name}',
    description: '${req.query.description}',
    id: '${id}',
        
    execute: (async(${objectName}, util) => {
// To learn more visit https://lnk.daalbot.xyz/EventsGuide
    })
}`;

    // Create folder
    await axios.post(`https://bot.daalbot.xyz/post/database/create`,{}, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/${id}/`,
            'type': 'folder',
            'data': '.',
        }
    });
    // Create file
    await axios.post(`https://bot.daalbot.xyz/post/database/create?enc=1`,{}, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/events/${id}/event.js`,
            'data': encodeURIComponent(eventFile),
            'type': 'file'
        }
    });

    // Update json
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
        message: 'Event created successfully',
        id: id
    });
}