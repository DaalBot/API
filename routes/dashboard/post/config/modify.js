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
    const content = req.query.content;

    if (!category || !type || !content) return res.status(400).send('Missing category, type or content query parameter');

    try {
        await axios.post(`https://bot.daalbot.xyz/post/database/create?enc=1`, {}, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/config/${guild}/${type}/${category}.id`,
                'data': encodeURIComponent(content),
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