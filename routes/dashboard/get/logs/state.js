const express = require('express');
const axios = require('axios');

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const guild = req.query.guild;
    const event = req.query.event?.toUpperCase();

    if (!event) return res.status(400).send('Missing event query parameter');

    try {
        const data = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': `/logging/${guild}/${event}.enabled`,
            }
        })

        return res.status(200).send(`${data.data}`); // If i dont do this express will see a channel id and think its a status code then throw a error
    } catch (error) {
        if (error?.response?.status === 404) {
            // Why does axios throw a eror when its just 404 😭
            return res.status(200).send('false');
        } else {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }
    }
}