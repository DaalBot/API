const client = require('../../../../client.js');
const express = require('express');
const { WebhookClient, ActionRowBuilder, ChannelType } = require('discord.js');

/**
 * @param {express.Request} req 
 * @param {express.Response} res 
*/
module.exports = async (req, res) => {
    const guild = req.query.guild;
    const channel = req.query.channel;
    const data = req.body.message ?? JSON.parse(req.query.data ?? '{}'); // Body > Query > {} (Fail)
    const message = data.content;
    const embed = data.embeds ?? [data.embed] ?? null; // Embeds > Embed > null
    // const row = data.row;
    const webhook = JSON.parse(req.query.webhook ?? '{}');

    if (!guild || !channel) {
        res.status(400).send('Bad Request - Missing guild or channel');
        return;
    }

    if (!embed && !message) {
        res.status(400).send('Bad Request - Missing content and embed');
        return;
    }

    const messagePayload = {
        content: message ? message : null,
        embeds: embed,
        // components: row ?? null
    };

    if (!data.id) {
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
    } else {
        const channelObj = client.channels.cache.get(channel);
        if (!channelObj || (channelObj.type !== ChannelType.GuildText && channelObj.type !== ChannelType.GuildAnnouncement)) return res.status(400).send('Bad Request - Invalid channel');

        const messageObj = await channelObj.messages.fetch(data.id);
        if (!messageObj) return res.status(400).send('Bad Request - Invalid message');

        if (messageObj.author.id !== client.user.id) {
            if (!messageObj.webhookId) return res.status(403).send('Forbidden - Not the author of the message'); // Not a webhook

            // Author is a webhook, But who's webhook? Hey, Michael VSauce here
            const webhooks = await channelObj.fetchWebhooks();
            const webhookClients = webhooks.filter(wh => wh.token && wh.owner.id === client.user.id);
            if (!webhookClients.length == 0) return res.status(424).send('No available webhooks');

            const webhookClient = webhookClients.find(wh => wh.id === messageObj.webhookId);
            if (!webhookClient) return res.status(403).send('Forbidden - Do not have access to the author webhook');

            await webhookClient.editMessage(data.id, {
                ...messagePayload,
                ...webhook
            });
        } else {
            await messageObj.edit(messagePayload);
        }
    }

    res.status(200).send('OK');
}
