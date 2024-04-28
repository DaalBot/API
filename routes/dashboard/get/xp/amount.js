const express = require('express');
const client = require('../../../../client.js');
const axios = require('axios');
require('dotenv').config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild
    const user = req.query.user
    if (!user) return res.status(400).json({ error: 'No user provided' })

    const response = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/xp/${guild}/${user}.xp`
        },
    })

    const data = response.data;

    res.status(200).send(`${data}`)
}