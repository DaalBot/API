const express = require('express');
const axios = require('axios');
require('dotenv').config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;
    const event = req.query.event?.toUpperCase();
    const state = req.query.state === 'true' ? 'true' : 'false'; // Force into boolean string

    if (!event) return res.status(400).send('Missing event query parameter');
    if (state !== 'true' && state !== 'false') return res.status(400).send('Invalid state query parameter');

    try {
        await axios.post(`https://bot.daalbot.xyz/post/database/create?enc=1`, {}, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/logging/${guild}/${event}.enabled`,
                'data': encodeURIComponent(state),
                'type': 'file'
            }
        })

        return res.status(200).send('OK');
    } catch (error) {
        if (error?.response?.status === 404) {
            // Why does axios throw a eror when its just 404 😭
            return res.status(404).send('Not found');
        } else {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }
    }
}