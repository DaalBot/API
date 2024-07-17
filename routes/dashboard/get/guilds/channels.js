const express = require('express');
const client = require('../../../../client.js');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = (req, res) => {
    const guild = req.query.guild;

    const channels = client.guilds.cache.get(guild).channels.cache.map(channel => {
        return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            category: channel.parent ? channel.parent.id : 'None',
            position: channel?.rawPosition,
        }
    })

    res.send(channels);
}