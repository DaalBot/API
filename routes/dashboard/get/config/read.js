const express = require('express');
const axios = require('axios');
require('dotenv').config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;
    const category = req.query.category;
    const type = req.query.type;

    if (!category || !type) return res.status(400).send('Missing category or type query parameter');

    try {
        const data = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/config/${guild}/${type}/${category}.id`,
            }
        })

        return res.status(200).send(`${data.data}`); // If i dont do this express will see a channel id and think its a status code then throw a error
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