const express = require('express'); // Type declaration for express
const axios = require('axios'); // For interacting with internal API
require('dotenv').config(); // Tokens
const client = require('../../../../client'); // Discord client

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */

module.exports = async (req, res) => {
    const guild = req.query.guild;

    const response = await axios.get(`https://bot.daalbot.xyz/get/database/readDir`, {
        headers: {
            'Authorization': process.env.BotCommunicationKey,
            'bot': 'Discord',
            'path': `/xp/${guild}/rewards`
        },
    })

    /**
     * @type {Array<{name: string, value: string}>}
    */
    let data = response.data;

    data = data.map((item) => {
        return {
            name: item.name,
            value: item.value,
            roleName: client.guilds.cache.get(guild).roles.cache.get(item.value).name
        }
    })

    res.status(200).send(data); // Send the data back to the client
}