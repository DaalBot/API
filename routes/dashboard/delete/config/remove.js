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
        await axios.delete(`https://bot.daalbot.xyz/delete/database/remove`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/config/${guild}/${type}/${category}.id`,
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