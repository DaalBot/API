const express = require('express');
const axios = require('axios');
require('dotenv').config();

/**
 * @param {express.Request} req
 * @param {express.Response} res
*/
module.exports = async(req, res) => {
    const socialPlatform = req.query.plat;
    const discordId = req.query.id; // Or username cuz well why not why not twitter why bloody not

    if (!socialPlatform || !discordId) return res.json({ error: 'Missing social platform or social id' });

    if (socialPlatform === 'youtube') {
        const { data } = await axios.get(`https://bot.daalbot.xyz/get/database/read`, {
            headers: {
                'Authorization': process.env.BotCommunicationKey,
                'bot': 'Discord',
                'path': '/socialalert/youtube.csv'
            }
        })

        const dataSplit = data.split('\n');
        const dataFiltered = dataSplit.filter(d => d.split(',')[2] === discordId);

        if (dataFiltered.length === 0) return res.status(404).json({ error: 'No data found' });

        /**
         * [{}]
         * YChannel: string
         * Role: string
         * DChannel: string
         */
        let returnVal = []

        for (let i = 0; i < dataFiltered.length; i++) {
            const data = dataFiltered[i];
            const dataSplit = data.split(',');

            returnVal.push({
                YChannel: dataSplit[0],
                Role: dataSplit[1] === 'None' ? null : dataSplit[1],
                DChannel: dataSplit[2]
            })
        }

        return res.json(returnVal)
    }
}