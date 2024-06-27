const client = require('../../../../client.js');
const express = require('express');
const { WebhookClient, ActionRowBuilder } = require('discord.js');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = async (req, res) => {
    const guild = req.query.guild;
    const channel = req.query.channel;
    const data = JSON.parse(req.query.data);
    const message = data.content;
    const embed = data.embed;
    // const row = data.row;
    const webhook = JSON.parse(req.query.webhook ?? '{}');

    if (!guild || !channel) {
        res.status(400).send('Bad Request');
        return;
    }

    if (!embed && !message) {
        res.status(400).send('Bad Request');
        return;
    }

    const messagePayload = {
        content: message ? message : null,
        embeds: embed ? [embed] : null,
        // components: row ?? null
    };

    if (!webhook.username) { // Send message as bot
        client.guilds.cache.get(guild).channels.cache.get(channel).send(messagePayload);
    } else { // Send message as webhook of bot
        const webhooks = await client.guilds.cache.get(guild).channels.cache.get(channel).fetchWebhooks();
        /**
         * @type {WebhookClient}
        */
        const webhookClient = webhooks.find(wh => wh.token && wh.owner.id === client.user.id);
        if (!webhookClient) return res.status(424).send('No available webhooks');

        webhookClient.send({
            ...messagePayload,
            ...webhook
        });
    }

    res.status(200).send('OK');
}
