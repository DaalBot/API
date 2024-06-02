const client = require('../../../../client.js');
const express = require('express');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = (req, res) => {
    const guild = req.query.guild;
    const channel = req.query.channel;
    const data = JSON.parse(req.query.data);
    const message = data.message;
    const embed = data.embed;

    if (!guild || !channel) {
        res.status(400).send('Bad Request');
        return;
    }

    if (!embed && !message) {
        res.status(400).send('Bad Request');
        return;
    }

    client.guilds.cache.get(guild).channels.cache.get(channel).send({
        content: message ? message : null,
        embeds: embed ? [embed] : null
    })

    res.status(200).send('OK');
}
