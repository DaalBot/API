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
    const message = data.content;
    const embed = data.embed;

    console.log(message)

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
